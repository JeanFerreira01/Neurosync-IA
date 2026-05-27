import uuid
from django.db import models
from apps.core.models import TimeStampedModel


class Transaction(TimeStampedModel):
    class Type(models.TextChoices):
        INCOME = "income", "Receita"
        EXPENSE = "expense", "Despesa"

    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PAID = "paid", "Pago"
        OVERDUE = "overdue", "Vencido"
        CANCELED = "canceled", "Cancelado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(
        "core.Clinic", on_delete=models.CASCADE, related_name="transactions"
    )
    appointment = models.OneToOneField(
        "appointments.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transaction",
    )
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    type = models.CharField(max_length=10, choices=Type)
    status = models.CharField(max_length=10, choices=Status, default=Status.PENDING)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    due_date = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    insurance = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "Transação"
        verbose_name_plural = "Transações"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_type_display()} — R$ {self.amount} — {self.description}"
