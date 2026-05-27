from django.contrib import admin
from .models import Patient, MedicalRecord, Document


class MedicalRecordInline(admin.StackedInline):
    model = MedicalRecord
    extra = 0


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0
    readonly_fields = ("uploaded_by", "created_at")


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("full_name", "cpf", "phone", "email", "health_insurance", "is_active", "clinic", "created_at")
    list_filter = ("is_active", "gender", "clinic")
    search_fields = ("full_name", "cpf", "email", "phone")
    ordering = ("full_name",)
    inlines = [MedicalRecordInline, DocumentInline]
