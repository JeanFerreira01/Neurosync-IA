from datetime import timedelta
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Product, StockMovement
from .serializers import ProductSerializer, StockMovementSerializer


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Product.objects.all()
        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)

        params = self.request.query_params
        if category := params.get("category"):
            qs = qs.filter(category=category)
        if is_active := params.get("is_active"):
            active_bool = is_active.lower() not in ("false", "0", "no")
            qs = qs.filter(is_active=active_bool)
        if params.get("low_stock", "").lower() in ("true", "1", "yes"):
            # Filter products where quantity <= min_quantity using F expressions
            from django.db.models import F
            qs = qs.filter(quantity__lte=F("min_quantity"))

        return qs

    @action(detail=False, methods=["get"], url_path="alerts")
    def alerts(self, request):
        user = request.user
        qs = Product.objects.filter(is_active=True)
        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)

        from django.db.models import F, Q
        threshold_date = (timezone.now() + timedelta(days=30)).date()
        qs = qs.filter(
            Q(quantity__lte=F("min_quantity")) | Q(expiry_date__lte=threshold_date)
        )
        return Response(ProductSerializer(qs, many=True, context={"request": request}).data)

    @action(detail=True, methods=["get"], url_path="movements")
    def movements(self, request, pk=None):
        product = self.get_object()
        movements = StockMovement.objects.filter(product=product).select_related(
            "performed_by"
        )
        return Response(
            StockMovementSerializer(movements, many=True, context={"request": request}).data
        )


class StockMovementViewSet(viewsets.ModelViewSet):
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = StockMovement.objects.select_related("product", "performed_by")
        if not user.is_admin_master:
            qs = qs.filter(product__clinic=user.clinic)

        params = self.request.query_params
        if product_id := params.get("product"):
            qs = qs.filter(product_id=product_id)
        if type_filter := params.get("type"):
            qs = qs.filter(type=type_filter)

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        movement_type = serializer.validated_data["type"]
        quantity = serializer.validated_data["quantity"]
        product = serializer.validated_data["product"]

        # Validate product belongs to the user's clinic (unless admin_master)
        user = request.user
        if not user.is_admin_master and product.clinic != user.clinic:
            return Response(
                {"detail": "Produto não pertence à clínica do usuário."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ADDITIVE_TYPES = {
            StockMovement.MovementType.ENTRY,
            StockMovement.MovementType.ADJUSTMENT,
        }
        SUBTRACTIVE_TYPES = {
            StockMovement.MovementType.EXIT,
            StockMovement.MovementType.LOSS,
            StockMovement.MovementType.INTERNAL,
        }

        if movement_type in ADDITIVE_TYPES:
            product.quantity += quantity
        elif movement_type in SUBTRACTIVE_TYPES:
            if product.quantity < quantity:
                return Response(
                    {
                        "detail": (
                            f"Estoque insuficiente. Disponível: {product.quantity}, "
                            f"solicitado: {quantity}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            product.quantity -= quantity

        product.save(update_fields=["quantity", "updated_at"])
        serializer.save(performed_by=user)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )
