from rest_framework import serializers
from apps.core.models import Clinic
from .models import Patient, MedicalRecord, Document


class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ["id", "chief_complaint", "history", "diagnosis", "medications",
                  "allergies", "family_history", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["id", "title", "file", "uploaded_by", "uploaded_by_name", "created_at"]
        read_only_fields = ["id", "uploaded_by", "created_at"]

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else ""

    def create(self, validated_data):
        validated_data["uploaded_by"] = self.context["request"].user
        return super().create(validated_data)


class PatientListSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ["id", "full_name", "cpf", "date_of_birth", "age", "gender",
                  "email", "phone", "health_insurance", "is_active", "created_at"]

    def get_age(self, obj):
        if not obj.date_of_birth:
            return None
        from datetime import date
        today = date.today()
        born = obj.date_of_birth
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


class PatientDetailSerializer(PatientListSerializer):
    medical_record = MedicalRecordSerializer(read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta(PatientListSerializer.Meta):
        fields = PatientListSerializer.Meta.fields + [
            "address", "emergency_contact", "emergency_phone",
            "notes", "medical_record", "documents", "updated_at",
        ]

    def _resolve_clinic(self, user):
        """Resolve a clínica do usuário; cria uma padrão se for admin_master sem clínica."""
        if user.clinic:
            return user.clinic
        if user.is_admin_master:
            clinic, _ = Clinic.objects.get_or_create(
                name="Clínica Padrão",
                defaults={"plan": "basic"},
            )
            user.clinic = clinic
            user.save(update_fields=["clinic"])
            return clinic
        raise serializers.ValidationError(
            {"clinic": "Usuário não está associado a nenhuma clínica."}
        )

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["clinic"] = self._resolve_clinic(user)
        patient = super().create(validated_data)
        MedicalRecord.objects.create(patient=patient)
        return patient
