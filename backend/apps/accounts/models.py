from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN_MASTER = "admin_master", "Admin Master"
        CLINIC_ADMIN = "clinic_admin", "Administrador da Clínica"
        NEUROPSYCHOLOGIST = "neuropsychologist", "Neuropsicólogo"
        RECEPTIONIST = "receptionist", "Recepção"
        PATIENT = "patient", "Paciente"

    role = models.CharField(max_length=20, choices=Role, default=Role.RECEPTIONIST)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    clinic = models.ForeignKey(
        "core.Clinic",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    @property
    def is_admin_master(self):
        return self.role == self.Role.ADMIN_MASTER

    @property
    def is_clinic_admin(self):
        return self.role == self.Role.CLINIC_ADMIN

    @property
    def is_neuropsychologist(self):
        return self.role == self.Role.NEUROPSYCHOLOGIST
