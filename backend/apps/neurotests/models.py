import uuid
from django.db import models
from apps.core.models import TimeStampedModel


class NeurotestScale(TimeStampedModel):
    CATEGORY_CHOICES = [
        ("intelligence", "Inteligência e Cognição"),
        ("memory", "Memória e Aprendizagem"),
        ("attention", "Atenção e Funções Executivas"),
        ("development", "Desenvolvimento / TDAH"),
        ("autism", "TEA / Neurodesenvolvimento"),
        ("personality", "Personalidade e Projetivos"),
        ("neuropsych", "Avaliação Neuropsicológica Geral"),
        ("other", "Outro"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(
        "core.Clinic", on_delete=models.CASCADE,
        related_name="neurotest_scales", null=True, blank=True,
    )
    name = models.CharField(max_length=255)
    abbreviation = models.CharField(
        max_length=30, blank=True,
        help_text="Sigla usada no laudo e no estoque (ex: WISC-V)",
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True)
    description = models.TextField(blank=True)
    age_range = models.CharField(max_length=50, blank=True, help_text="Ex: 6 a 16 anos")
    application_time = models.CharField(max_length=50, blank=True, help_text="Ex: 60–90 min")
    is_active = models.BooleanField(default=True)
    scoring_guide = models.TextField(blank=True)

    class Meta:
        verbose_name = "Escala Neuropsicológica"
        verbose_name_plural = "Escalas Neuropsicológicas"
        ordering = ["name"]

    def __str__(self):
        return self.abbreviation or self.name


class NeurotestSession(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        IN_PROGRESS = "in_progress", "Em Andamento"
        COMPLETED = "completed", "Concluído"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="neurotest_sessions"
    )
    professional = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="neurotest_sessions"
    )
    scale = models.ForeignKey(
        NeurotestScale, on_delete=models.CASCADE, related_name="sessions"
    )
    appointment = models.ForeignKey(
        "appointments.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=15, choices=Status, default=Status.PENDING)
    raw_score = models.FloatField(null=True, blank=True)
    normalized_score = models.FloatField(null=True, blank=True)
    observations = models.TextField(blank=True)
    answers = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Sessão de Teste"
        verbose_name_plural = "Sessões de Testes"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.scale} — {self.patient}"
