from django.contrib import admin
from .models import ScrapingJob


@admin.register(ScrapingJob)
class ScrapingJobAdmin(admin.ModelAdmin):
    list_display = ["fuente", "estado", "total_nuevos", "total_duplicados", "iniciado_en", "finalizado_en"]
    list_filter = ["estado", "fuente"]
    readonly_fields = ["iniciado_en", "finalizado_en", "error_mensaje"]
