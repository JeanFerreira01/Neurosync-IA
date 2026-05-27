from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet

app_name = "financial"

router = DefaultRouter()
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    path("", include(router.urls)),
]
