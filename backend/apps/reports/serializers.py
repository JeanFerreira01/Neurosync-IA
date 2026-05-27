from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Report, ReportTemplate, ReportVersion

User = get_user_model()


class ReportTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportTemplate
        fields = ["id", "name", "description", "sections", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["clinic"] = _resolve_clinic(user)
        return super().create(validated_data)


class ReportVersionSerializer(serializers.ModelSerializer):
    saved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReportVersion
        fields = ["id", "version_number", "sections_snapshot", "saved_by_name", "created_at"]

    def get_saved_by_name(self, obj):
        if obj.saved_by:
            return obj.saved_by.get_full_name() or obj.saved_by.username
        return "—"


class ReportSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    professional_name = serializers.SerializerMethodField()
    template_name = serializers.SerializerMethodField()
    professional = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False
    )

    class Meta:
        model = Report
        fields = [
            "id", "patient", "patient_name", "appointment", "professional", "professional_name",
            "template", "template_name", "title", "sections", "selected_tests", "test_scores",
            "assessment_file", "status", "pdf_file", "signed_at", "signed_by_name", "version", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "pdf_file", "signed_at", "signed_by_name", "version", "created_at", "updated_at"]
        extra_kwargs = {"selected_tests": {"required": False}, "test_scores": {"required": False}}

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_professional_name(self, obj):
        return obj.professional.get_full_name() or obj.professional.username

    def get_template_name(self, obj):
        return obj.template.name if obj.template else None

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["clinic"] = _resolve_clinic(user)
        validated_data.setdefault("professional", user)
        report = super().create(validated_data)
        ReportVersion.objects.create(
            report=report,
            version_number=1,
            sections_snapshot=report.sections,
            saved_by=user,
        )
        self._deduct_inventory(report, user)
        return report

    def _deduct_inventory(self, report, user):
        from apps.inventory.models import Product, StockMovement
        for test_name in (report.selected_tests or []):
            product = Product.objects.filter(
                clinic=report.clinic, test_name=test_name, is_active=True
            ).first()
            if product and product.quantity > 0:
                product.quantity -= 1
                product.save(update_fields=["quantity", "updated_at"])
                StockMovement.objects.create(
                    product=product,
                    type=StockMovement.MovementType.INTERNAL,
                    quantity=1,
                    notes=f"Uso automático — Laudo: {report.title}",
                    performed_by=user,
                )

    def update(self, instance, validated_data):
        # Salva snapshot antes de atualizar
        if "sections" in validated_data:
            ReportVersion.objects.create(
                report=instance,
                version_number=instance.version,
                sections_snapshot=instance.sections,
                saved_by=self.context["request"].user,
            )
            instance.version += 1
        return super().update(instance, validated_data)


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
