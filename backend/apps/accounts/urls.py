from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    MeView,
    RegisterView,
    AdminRegisterView,
    ChangePasswordView,
    LogoutView,
    UserListView,
    UserDetailView,
)

app_name = "accounts"

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("register/", RegisterView.as_view(), name="register"),           # público
    path("admin/register/", AdminRegisterView.as_view(), name="admin_register"),  # admin
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("users/", UserListView.as_view(), name="user_list"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user_detail"),
]
