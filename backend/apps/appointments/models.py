import uuid
from django.db import models
from apps.core.models import TimeStampedModel


class Appointment(TimeStampedModel):
    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmado"
        PENDING = "pending", "Pendente"
        IN_PROGRESS = "in_progress", "Em Andamento"
        FINISHED = "finished", "Finalizado"
        CANCELED = "canceled", "Cancelado"
        NO_SHOW = "no_show", "Falta"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(
        "core.Clinic", on_delete=models.CASCADE, related_name="appointments"
    )
    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="appointments"
    )
    professional = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="appointments"
    )
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    notes = models.TextField(blank=True)
    checkin_at = models.DateTimeField(null=True, blank=True)
    checkout_at = models.DateTimeField(null=True, blank=True)
    is_telemedicine = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Agendamento"
        verbose_name_plural = "Agendamentos"
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.patient} — {self.scheduled_at:%d/%m/%Y %H:%M}"


class BlockedSlot(TimeStampedModel):
    clinic = models.ForeignKey(
        "core.Clinic", on_delete=models.CASCADE, related_name="blocked_slots"
    )
    professional = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="blocked_slots"
    )
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Horário Bloqueado"
        verbose_name_plural = "Horários Bloqueados"

    def __str__(self):
        return f"Bloqueio {self.professional} — {self.start_at:%d/%m/%Y %H:%M}"
