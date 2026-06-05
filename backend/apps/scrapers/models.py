from django.db import models
from apps.licitaciones.models import FuenteScraping


class ScrapingJob(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        CORRIENDO = "corriendo", "Corriendo"
        COMPLETADO = "completado", "Completado"
        FALLIDO = "fallido", "Fallido"

    fuente = models.ForeignKey(FuenteScraping, on_delete=models.CASCADE, related_name="jobs")
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    iniciado_en = models.DateTimeField(null=True, blank=True)
    finalizado_en = models.DateTimeField(null=True, blank=True)
    total_encontrados = models.IntegerField(default=0)
    total_nuevos = models.IntegerField(default=0)
    total_duplicados = models.IntegerField(default=0)
    error_mensaje = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "job de scraping"

    def __str__(self):
        return f"{self.fuente.nombre} [{self.estado}] {self.created_at:%Y-%m-%d %H:%M}"
