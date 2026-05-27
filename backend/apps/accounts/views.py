from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.permissions import IsAdminMaster, IsClinicAdmin
from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RegisterView(generics.CreateAPIView):
    """Auto-cadastro público — cria conta com role neuropsychologist."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Auto-cadastro sempre cria como neuropsicólogo
        serializer.save(role="neuropsychologist")


class AdminRegisterView(generics.CreateAPIView):
    """Criação de usuário pelo Admin Master — permite qualquer role."""
    serializer_class = RegisterSerializer
    permission_classes = [IsAdminMaster | IsClinicAdmin]


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Senha alterada com sucesso."})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh = request.data["refresh"]
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            pass
        return Response({"detail": "Logout realizado."}, status=status.HTTP_205_RESET_CONTENT)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsClinicAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_master:
            return User.objects.all()
        return User.objects.filter(clinic=user.clinic)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsClinicAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_master:
            return User.objects.all()
        return User.objects.filter(clinic=user.clinic)
