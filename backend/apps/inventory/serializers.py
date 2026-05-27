from rest_framework import serializers
from .models import Product, StockMovement


class ProductSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "clinic",
            "name",
            "test_name",
            "category",
            "quantity",
            "min_quantity",
            "unit_price",
            "supplier",
            "expiry_date",
            "is_active",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "clinic", "created_at", "updated_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["clinic"] = _resolve_clinic(user)
        return super().create(validated_data)


class StockMovementSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product",
            "product_name",
            "type",
            "quantity",
            "notes",
            "performed_by",
            "performed_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "performed_by", "created_at", "updated_at"]

    def get_performed_by_name(self, obj):
        if obj.performed_by:
            return obj.performed_by.get_full_name() or obj.performed_by.username
        return None

    def get_product_name(self, obj):
        return obj.product.name


def _resolve_clinic(user):
    if user.clinic:
        return user.clinic
    if user.is_admin_master:
        from apps.core.models import Clinic
        clinic, _ = Clinic.objects.get_or_create(
            name="Clínica Padrão", defaults={"plan": "basic"}
        )
        user.clinic = clinic
        user.save(update_fields=["clinic"])
        return clinic
    raise serializers.ValidationError({"clinic": "Usuário sem clínica associada."})
