import uuid
from django.db import models
from apps.core.models import TimeStampedModel


class Patient(TimeStampedModel):
    class Gender(models.TextChoices):
        MALE = "M", "Masculino"
        FEMALE = "F", "Feminino"
        OTHER = "O", "Outro"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(
        "core.Clinic", on_delete=models.CASCADE, related_name="patients"
    )
    full_name = models.CharField(max_length=255)
    cpf = models.CharField(max_length=14, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=Gender, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=255, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    health_insurance = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class MedicalRecord(TimeStampedModel):
    patient = models.OneToOneField(
        Patient, on_delete=models.CASCADE, related_name="medical_record"
    )
    chief_complaint = models.TextField(blank=True)
    history = models.TextField(blank=True)
    diagnosis = models.TextField(blank=True)
    medications = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    family_history = models.TextField(blank=True)

    class Meta:
        verbose_name = "Prontuário"
        verbose_name_plural = "Prontuários"

    def __str__(self):
        return f"Prontuário — {self.patient}"


class Document(TimeStampedModel):
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="documents"
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="patient_docs/%Y/%m/")
    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True
    )

    class Meta:
        verbose_name = "Documento"
        verbose_name_plural = "Documentos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.patient}"
