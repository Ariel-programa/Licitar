from rest_framework import serializers
from apps.licitaciones.models import FuenteScraping
from .models import ScrapingJob


class FuenteScrapingSerializer(serializers.ModelSerializer):
    ultimo_job = serializers.SerializerMethodField()

    class Meta:
        model = FuenteScraping
        fields = ["id", "nombre", "url_base", "tipo", "activa", "ultimo_scraping", "ultimo_job"]

    def get_ultimo_job(self, obj):
        job = obj.jobs.first()
        if not job:
            return None
        return {
            "id": job.id,
            "estado": job.estado,
            "total_nuevos": job.total_nuevos,
            "error_mensaje": job.error_mensaje,
            "finalizado_en": job.finalizado_en,
        }


class ScrapingJobSerializer(serializers.ModelSerializer):
    fuente_nombre = serializers.CharField(source="fuente.nombre", read_only=True)
    duracion = serializers.SerializerMethodField()

    class Meta:
        model = ScrapingJob
        fields = [
            "id", "fuente_nombre", "estado", "total_nuevos", "total_duplicados",
            "error_mensaje", "iniciado_en", "finalizado_en", "duracion", "created_at"
        ]

    def get_duracion(self, obj):
        if obj.iniciado_en and obj.finalizado_en:
            delta = obj.finalizado_en - obj.iniciado_en
            return int(delta.total_seconds())
        return None