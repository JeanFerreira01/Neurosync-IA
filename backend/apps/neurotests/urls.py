from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NeurotestScaleViewSet, NeurotestSessionViewSet

app_name = "neurotests"

router = DefaultRouter()
router.register("scales", NeurotestScaleViewSet, basename="scale")
router.register("sessions", NeurotestSessionViewSet, basename="session")

urlpatterns = [
    path("", include(router.urls)),
]
