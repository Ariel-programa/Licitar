from django.db import models


class FuenteScraping(models.Model):
    nombre = models.CharField(max_length=200)
    url_base = models.URLField()
    tipo = models.CharField(max_length=50)  # ministerio, hospital, provincia, portal
    activa = models.BooleanField(default=True)
    ultimo_scraping = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "fuente de scraping"
        verbose_name_plural = "fuentes de scraping"

    def __str__(self):
        return self.nombre


class Licitacion(models.Model):
    class Estado(models.TextChoices):
        ABIERTA = "abierta", "Abierta"
        CERRADA = "cerrada", "Cerrada"
        ADJUDICADA = "adjudicada", "Adjudicada"
        SUSPENDIDA = "suspendida", "Suspendida"
        DESCONOCIDO = "desconocido", "Desconocido"

    fuente = models.ForeignKey(FuenteScraping, on_delete=models.SET_NULL, null=True, related_name="licitaciones")
    numero_expediente = models.CharField(max_length=200, blank=True)
    titulo = models.CharField(max_length=500)
    descripcion = models.TextField(blank=True)
    organismo = models.CharField(max_length=300)
    estado = models.CharField(max_length=30, choices=Estado.choices, default=Estado.DESCONOCIDO)
    fecha_publicacion = models.DateField(null=True, blank=True)
    fecha_apertura = models.DateField(null=True, blank=True)
    monto_estimado = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    url_original = models.URLField(max_length=1000, blank=True)
    url_pliego = models.URLField(max_length=1000, blank=True)
    archivo_pliego = models.FileField(upload_to="pliegos/", null=True, blank=True)
    texto_ocr = models.TextField(blank=True)
    hash_contenido = models.CharField(max_length=64, blank=True, db_index=True)  # dedup
    provincia = models.CharField(max_length=100, blank=True)
    rubro = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "licitación"
        verbose_name_plural = "licitaciones"
        ordering = ["-fecha_publicacion", "-created_at"]
        indexes = [
            models.Index(fields=["estado", "fecha_apertura"]),
            models.Index(fields=["organismo"]),
            models.Index(fields=["provincia"]),
        ]

    def __str__(self):
        return f"{self.numero_expediente} - {self.titulo[:60]}"


class Favorito(models.Model):
    from django.conf import settings
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favoritos")
    licitacion = models.ForeignKey(Licitacion, on_delete=models.CASCADE, related_name="favoritos")
    nota = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("usuario", "licitacion")]
        verbose_name = "favorito"

    def __str__(self):
        return f"{self.usuario.email} → {self.licitacion}"
