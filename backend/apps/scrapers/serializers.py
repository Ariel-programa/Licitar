from rest_framework import serializers
from .models import ScrapingJob
from apps.licitaciones.models import FuenteScraping


class ScrapingJobSerializer(serializers.ModelSerializer):
    fuente_nombre = serializers.CharField(source="fuente.nombre", read_only=True)
    duracion_segundos = serializers.SerializerMethodField()

    class Meta:
        model = ScrapingJob
        fields = [
            "id", "fuente", "fuente_nombre", "estado",
            "iniciado_en", "finalizado_en", "duracion_segundos",
            "total_encontrados", "total_nuevos", "total_duplicados",
            "error_mensaje", "created_at",
        ]

    def get_duracion_segundos(self, obj):
        if obj.iniciado_en and obj.finalizado_en:
            return int((obj.finalizado_en - obj.iniciado_en).total_seconds())
        return None


class FuenteScrapingSerializer(serializers.ModelSerializer):
    ultimo_job = serializers.SerializerMethodField()

    class Meta:
        model = FuenteScraping
        fields = ["id", "nombre", "url_base", "tipo", "activa", "ultimo_scraping", "created_at", "ultimo_job"]

    def get_ultimo_job(self, obj):
        job = obj.jobs.order_by("-created_at").first()
        if job:
            return {
                "estado": job.estado,
                "total_nuevos": job.total_nuevos,
                "finalizado_en": job.finalizado_en,
                "error_mensaje": job.error_mensaje,
            }
        return None
