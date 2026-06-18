from rest_framework import generics, permissions, viewsets
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .models import User
from .serializers import UserSerializer, RegisterSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["email"] = self.user.email
        data["role"] = self.user.role
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        credential = request.data.get("credential")
        if not credential:
            return Response({"error": "credential requerido"}, status=400)
        if not settings.GOOGLE_CLIENT_ID:
            return Response({"error": "Google OAuth no configurado"}, status=503)

        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response({"error": "Token de Google inválido"}, status=400)

        email = idinfo.get("email")
        if not email:
            return Response({"error": "No se pudo obtener el email de Google"}, status=400)

        username = email.split("@")[0]
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={"username": username, "is_active": True},
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "email": user.email,
            "role": user.role,
        })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.all().order_by("-created_at")