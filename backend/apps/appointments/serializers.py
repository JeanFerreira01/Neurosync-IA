from rest_framework import serializers
from django.utils import timezone
from .models import Appointment, BlockedSlot


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
    raise serializers.ValidationError(
        {"clinic": "Usuário não está associado a nenhuma clínica."}
    )


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    professional_name = serializers.SerializerMethodField()
    # professional é opcional no payload — default = usuário logado
    professional = serializers.PrimaryKeyRelatedField(
        queryset=__import__("apps.accounts.models", fromlist=["User"]).User.objects.all(),
        required=False,
    )

    class Meta:
        model = Appointment
        fields = [
            "id", "clinic", "patient", "patient_name", "professional", "professional_name",
            "status", "scheduled_at", "duration_minutes", "notes",
            "checkin_at", "checkout_at", "is_telemedicine", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "clinic", "checkin_at", "checkout_at", "created_at", "updated_at"]

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_professional_name(self, obj):
        return obj.professional.get_full_name() or obj.professional.username

    def validate(self, attrs):
        scheduled_at = attrs.get("scheduled_at", getattr(self.instance, "scheduled_at", None))
        duration = attrs.get("duration_minutes", getattr(self.instance, "duration_minutes", 60))
        professional = attrs.get("professional", getattr(self.instance, "professional", None))
        instance_id = self.instance.pk if self.instance else None

        if scheduled_at and scheduled_at < timezone.now():
            raise serializers.ValidationError({"scheduled_at": "Não é possível agendar no passado."})

        if professional and scheduled_at:
            from datetime import timedelta
            end_at = scheduled_at + timedelta(minutes=duration)
            conflict = Appointment.objects.filter(
                professional=professional,
                scheduled_at__lt=end_at,
                status__in=["confirmed", "pending", "in_progress"],
            ).exclude(pk=instance_id)

            for appt in conflict:
                from datetime import timedelta as td
                appt_end = appt.scheduled_at + td(minutes=appt.duration_minutes)
                if scheduled_at < appt_end:
                    raise serializers.ValidationError(
                        {"scheduled_at": f"Conflito com agendamento às {appt.scheduled_at:%H:%M}."}
                    )
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["clinic"] = _resolve_clinic(user)
        validated_data.setdefault("professional", user)
        return super().create(validated_data)


class BlockedSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedSlot
        fields = ["id", "clinic", "professional", "start_at", "end_at", "reason", "created_at"]
        read_only_fields = ["id", "clinic", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["clinic"] = _resolve_clinic(user)
        return super().create(validated_data)
