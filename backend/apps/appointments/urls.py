from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, BlockedSlotViewSet

app_name = "appointments"

router = DefaultRouter()
router.register("blocked-slots", BlockedSlotViewSet, basename="blocked-slot")
router.register("", AppointmentViewSet, basename="appointment")

urlpatterns = [path("", include(router.urls))]
