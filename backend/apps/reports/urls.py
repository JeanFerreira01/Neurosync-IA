from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, ReportTemplateViewSet

app_name = "reports"

router = DefaultRouter()
router.register("templates", ReportTemplateViewSet, basename="report-template")
router.register("", ReportViewSet, basename="report")

urlpatterns = [
    path("", include(router.urls)),
]
