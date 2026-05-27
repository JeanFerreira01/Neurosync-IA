from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "clinic",
            "appointment",
            "patient",
            "patient_name",
            "type",
            "status",
            "amount",
            "description",
            "due_date",
            "paid_at",
            "payment_method",
            "insurance",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "clinic", "created_at", "updated_at"]

    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.full_name
        return None

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["clinic"] = _resolve_clinic(user)
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
