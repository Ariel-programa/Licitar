from rest_framework import viewsets, permissions
from .models import Licitacion, FuenteScraping, Favorito
from .serializers import LicitacionSerializer, FuenteSerializer, FavoritoSerializer
from .filters import LicitacionFilter


class IsAnalystOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in ("admin", "analyst")


class LicitacionViewSet(viewsets.ModelViewSet):
    queryset = Licitacion.objects.select_related("fuente").all()
    serializer_class = LicitacionSerializer
    filterset_class = LicitacionFilter
    search_fields = ["titulo", "descripcion", "organismo", "numero_expediente"]
    ordering_fields = ["fecha_publicacion", "fecha_apertura", "monto_estimado", "created_at"]
    ordering = ["-fecha_publicacion"]
    permission_classes = [IsAnalystOrAdmin]

    def get_serializer_context(self):
        return {"request": self.request}


class FavoritoViewSet(viewsets.ModelViewSet):
    serializer_class = FavoritoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorito.objects.filter(usuario=self.request.user).select_related("licitacion")

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class FuenteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FuenteScraping.objects.filter(activa=True)
    serializer_class = FuenteSerializer
    permission_classes = [permissions.IsAuthenticated]