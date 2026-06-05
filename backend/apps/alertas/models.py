from django.conf import settings
from django.db import models


class Alerta(models.Model):
    class Canal(models.TextChoices):
        EMAIL = "email", "Email"
        TELEGRAM = "telegram", "Telegram"

    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="alertas")
    nombre = models.CharField(max_length=200)
    palabras_clave = models.TextField(help_text="Una por línea")
    provincia = models.CharField(max_length=100, blank=True)
    rubro = models.CharField(max_length=200, blank=True)
    canal = models.CharField(max_length=20, choices=Canal.choices, default=Canal.EMAIL)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "alerta"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.usuario.email})"


class NotificacionEnviada(models.Model):
    alerta = models.ForeignKey(Alerta, on_delete=models.CASCADE, related_name="notificaciones")
    licitacion_id = models.IntegerField()
    enviada_en = models.DateTimeField(auto_now_add=True)
    canal = models.CharField(max_length=20)
    exitosa = models.BooleanField(default=True)
    error = models.TextField(blank=True)

    class Meta:
        unique_together = [("alerta", "licitacion_id")]
