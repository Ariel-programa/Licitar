from rest_framework import serializers
from .models import Licitacion, FuenteScraping, Favorito


class FuenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuenteScraping
        fields = ["id", "nombre", "url_base", "tipo", "activa", "ultimo_scraping"]


class LicitacionSerializer(serializers.ModelSerializer):
    fuente_nombre = serializers.CharField(source="fuente.nombre", read_only=True)
    es_favorito = serializers.SerializerMethodField()

    class Meta:
        model = Licitacion
        fields = [
            "id", "numero_expediente", "titulo", "descripcion", "organismo",
            "estado", "fecha_publicacion", "fecha_apertura", "monto_estimado",
            "url_original", "url_pliego", "provincia", "rubro",
            "fuente_nombre", "es_favorito", "created_at",
        ]

    def get_es_favorito(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.favoritos.filter(usuario=request.user).exists()
        return False


class FavoritoSerializer(serializers.ModelSerializer):
    licitacion = LicitacionSerializer(read_only=True)
    licitacion_id = serializers.PrimaryKeyRelatedField(
        queryset=Licitacion.objects.all(), source="licitacion", write_only=True
    )

    class Meta:
        model = Favorito
        fields = ["id", "licitacion", "licitacion_id", "nota", "created_at"]
