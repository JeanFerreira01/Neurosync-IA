import uuid
from django.db import models
from apps.core.models import TimeStampedModel


class Product(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(
        "core.Clinic", on_delete=models.CASCADE, related_name="products"
    )
    name = models.CharField(max_length=255)
    test_name = models.CharField(max_length=255, blank=True, help_text="Nome exato do teste no sistema de laudos (ex: WISC-V)")
    category = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField(default=0)
    min_quantity = models.PositiveIntegerField(default=4)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    supplier = models.CharField(max_length=255, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.quantity <= self.min_quantity


class StockMovement(TimeStampedModel):
    class MovementType(models.TextChoices):
        ENTRY = "entry", "Entrada"
        EXIT = "exit", "Saída"
        ADJUSTMENT = "adjustment", "Ajuste"
        LOSS = "loss", "Perda"
        INTERNAL = "internal", "Consumo Interno"

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="movements"
    )
    type = models.CharField(max_length=20, choices=MovementType)
    quantity = models.IntegerField()
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True
    )

    class Meta:
        verbose_name = "Movimentação de Estoque"
        verbose_name_plural = "Movimentações de Estoque"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_type_display()} — {self.product} — {self.quantity}"
