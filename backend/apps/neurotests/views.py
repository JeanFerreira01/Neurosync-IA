from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import NeurotestScale, NeurotestSession
from .serializers import NeurotestScaleSerializer, NeurotestSessionSerializer


class ScalePagination(PageNumberPagination):
    page_size = 500
    max_page_size = 500


class NeurotestScaleViewSet(viewsets.ModelViewSet):
    serializer_class = NeurotestScaleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ScalePagination

    def get_queryset(self):
        user = self.request.user
        qs = NeurotestScale.objects.all()
        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)

        params = self.request.query_params
        if category := params.get("category"):
            qs = qs.filter(category=category)
        if is_active := params.get("is_active"):
            qs = qs.filter(is_active=is_active.lower() not in ("false", "0", "no"))
        if params.get("low_stock", "").lower() in ("true", "1", "yes"):
            from apps.inventory.models import Product
            from django.db.models import F
            qs = qs.filter(
                abbreviation__in=Product.objects.filter(
                    clinic=user.clinic, quantity__lte=F("min_quantity")
                ).values_list("test_name", flat=True)
            )

        return qs

    @action(detail=False, methods=["get"], url_path="stock-summary")
    def stock_summary(self, request):
        user = request.user
        qs = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(qs, many=True)
        data = serializer.data
        return Response({
            "total": len(data),
            "ok": sum(1 for s in data if s["stock_info"]["status"] == "ok"),
            "low": sum(1 for s in data if s["stock_info"]["status"] == "low"),
            "zero": sum(1 for s in data if s["stock_info"]["status"] == "zero"),
            "untracked": sum(1 for s in data if s["stock_info"]["status"] == "untracked"),
        })


class NeurotestSessionViewSet(viewsets.ModelViewSet):
    serializer_class = NeurotestSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = NeurotestSession.objects.select_related("patient", "professional", "scale")
        if not user.is_admin_master:
            qs = qs.filter(patient__clinic=user.clinic)

        params = self.request.query_params
        if patient_id := params.get("patient"):
            qs = qs.filter(patient_id=patient_id)
        if scale_id := params.get("scale"):
            qs = qs.filter(scale_id=scale_id)
        if status_filter := params.get("status"):
            qs = qs.filter(status=status_filter)

        return qs
