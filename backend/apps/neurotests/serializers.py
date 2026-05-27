from rest_framework import serializers
from .models import NeurotestScale, NeurotestSession


class NeurotestScaleSerializer(serializers.ModelSerializer):
    stock_info = serializers.SerializerMethodField()
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = NeurotestScale
        fields = [
            "id", "clinic", "name", "abbreviation", "category", "category_display",
            "description", "age_range", "application_time", "is_active",
            "scoring_guide", "stock_info", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "clinic", "created_at", "updated_at"]

    def get_stock_info(self, obj):
        from apps.inventory.models import Product
        key = obj.abbreviation or obj.name
        if not key:
            return {"quantity": None, "min_quantity": 4, "status": "unknown", "product_count": 0}
        products = Product.objects.filter(
            clinic=obj.clinic, test_name__iexact=key, is_active=True
        )
        total_qty = sum(p.quantity for p in products)
        first = products.first()
        min_qty = first.min_quantity if first else 4
        if products.count() == 0:
            stock_status = "untracked"
        elif total_qty == 0:
            stock_status = "zero"
        elif total_qty <= min_qty:
            stock_status = "low"
        else:
            stock_status = "ok"
        return {
            "quantity": total_qty,
            "min_quantity": min_qty,
            "status": stock_status,
            "product_count": products.count(),
            "product_id": str(first.id) if first else None,
        }

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["clinic"] = _resolve_clinic(user)
        return super().create(validated_data)


class NeurotestSessionSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    professional_name = serializers.SerializerMethodField()
    scale_name = serializers.SerializerMethodField()
    scale_abbreviation = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = NeurotestSession
        fields = [
            "id", "patient", "patient_name", "professional", "professional_name",
            "scale", "scale_name", "scale_abbreviation",
            "appointment", "status", "status_display",
            "raw_score", "normalized_score", "observations", "answers",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "professional", "created_at", "updated_at"]

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_professional_name(self, obj):
        return obj.professional.get_full_name() or obj.professional.username

    def get_scale_name(self, obj):
        return obj.scale.name

    def get_scale_abbreviation(self, obj):
        return obj.scale.abbreviation

    def create(self, validated_data):
        validated_data["professional"] = self.context["request"].user
        return super().create(validated_data)


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
