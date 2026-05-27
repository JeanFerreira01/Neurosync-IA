from django.contrib import admin
from .models import Appointment, BlockedSlot


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "professional", "scheduled_at", "duration_minutes", "status", "is_telemedicine", "clinic")
    list_filter = ("status", "is_telemedicine", "clinic")
    search_fields = ("patient__full_name", "professional__first_name", "professional__last_name")
    ordering = ("-scheduled_at",)
    readonly_fields = ("checkin_at", "checkout_at", "created_at", "updated_at")


@admin.register(BlockedSlot)
class BlockedSlotAdmin(admin.ModelAdmin):
    list_display = ("professional", "start_at", "end_at", "reason", "clinic")
    list_filter = ("clinic",)
    search_fields = ("professional__first_name",)
