import uuid
from django.db import models
from apps.core.models import TimeStampedModel


class ReportTemplate(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(
        "core.Clinic", on_delete=models.CASCADE, related_name="report_templates"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sections = models.JSONField(default=list)  # [{title, placeholder}]
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Template de Laudo"
        verbose_name_plural = "Templates de Laudo"

    def __str__(self):
        return self.name


class Report(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Rascunho"
        REVIEW = "review", "Em Revisão"
        SIGNED = "signed", "Assinado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(
        "core.Clinic", on_delete=models.CASCADE, related_name="reports"
    )
    patient = models.ForeignKey(
        "patients.Patient", on_delete=models.CASCADE, related_name="reports"
    )
    appointment = models.ForeignKey(
        "appointments.Appointment",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="reports",
    )
    professional = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="reports"
    )
    template = models.ForeignKey(
        ReportTemplate, on_delete=models.SET_NULL, null=True, blank=True
    )
    title = models.CharField(max_length=255)
    sections = models.JSONField(default=list)          # [{title, content}]
    selected_tests = models.JSONField(default=list)    # ["WISC-V", "Conners 3"]
    test_scores = models.JSONField(default=dict)       # {"WISC-V": {"qi_total": 85, ...}}
    assessment_file = models.FileField(upload_to="reports/assessments/%Y/%m/", blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status, default=Status.DRAFT)
    pdf_file = models.FileField(upload_to="reports/%Y/%m/", blank=True, null=True)
    signed_at = models.DateTimeField(null=True, blank=True)
    signed_by_name = models.CharField(max_length=255, blank=True)
    version = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = "Laudo"
        verbose_name_plural = "Laudos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.patient}"


class ReportVersion(TimeStampedModel):
    """Histórico de versões do laudo."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="versions")
    version_number = models.PositiveIntegerField()
    sections_snapshot = models.JSONField()
    saved_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True
    )

    class Meta:
        verbose_name = "Versão do Laudo"
        ordering = ["-version_number"]

    def __str__(self):
        return f"{self.report} v{self.version_number}"
