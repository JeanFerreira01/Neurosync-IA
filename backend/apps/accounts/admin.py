from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "get_full_name", "role", "clinic", "is_active")
    list_filter = ("role", "is_active", "clinic")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("-created_at",)

    fieldsets = UserAdmin.fieldsets + (
        ("Dados Clínicos", {"fields": ("role", "phone", "avatar", "clinic")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Dados Clínicos", {"fields": ("role", "phone", "clinic")}),
    )
