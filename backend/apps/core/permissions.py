from rest_framework.permissions import BasePermission


class IsAdminMaster(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin_master


class IsClinicAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_clinic_admin or request.user.is_admin_master
        )


class IsNeuropsychologist(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_neuropsychologist


class SameClinic(BasePermission):
    def has_object_permission(self, request, view, obj):
        obj_clinic = getattr(obj, "clinic", None)
        if obj_clinic is None:
            return True
        return obj_clinic == request.user.clinic
