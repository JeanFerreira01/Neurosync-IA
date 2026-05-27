from django.contrib import admin
from .models import Clinic, AuditLog


@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display = ("name", "cnpj", "email", "plan", "is_active", "created_at")
    list_filter = ("is_active", "plan")
    search_fields = ("name", "cnpj", "email")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "resource", "user", "clinic", "ip_address", "created_at")
    list_filter = ("action", "clinic")
    search_fields = ("user__username", "resource", "ip_address")
    readonly_fields = ("user", "clinic", "action", "resource", "resource_id", "ip_address", "user_agent", "extra_data", "created_at")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
