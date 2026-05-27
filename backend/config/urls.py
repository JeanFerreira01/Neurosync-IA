from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

API_V1 = "api/v1/"

urlpatterns = [
    path("admin/", admin.site.urls),
    path(API_V1 + "auth/", include("apps.accounts.urls")),
    path(API_V1 + "patients/", include("apps.patients.urls")),
    path(API_V1 + "appointments/", include("apps.appointments.urls")),
    path(API_V1 + "reports/", include("apps.reports.urls")),
    path(API_V1 + "neurotests/", include("apps.neurotests.urls")),
    path(API_V1 + "financial/", include("apps.financial.urls")),
    path(API_V1 + "inventory/", include("apps.inventory.urls")),
    path(API_V1 + "whatsapp/", include("apps.whatsapp.urls")),
    path(API_V1 + "telemedicine/", include("apps.telemedicine.urls")),
    path(API_V1 + "ai/", include("apps.ai_engine.urls")),
    path(API_V1 + "core/", include("apps.core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
