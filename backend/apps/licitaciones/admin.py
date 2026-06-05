from django.contrib import admin
from .models import Licitacion, FuenteScraping, Favorito


@admin.register(FuenteScraping)
class FuenteAdmin(admin.ModelAdmin):
    list_display = ["nombre", "tipo", "activa", "ultimo_scraping"]
    list_filter = ["tipo", "activa"]


@admin.register(Licitacion)
class LicitacionAdmin(admin.ModelAdmin):
    list_display = ["numero_expediente", "titulo", "organismo", "estado", "fecha_apertura", "monto_estimado"]
    list_filter = ["estado", "provincia", "fuente"]
    search_fields = ["titulo", "organismo", "numero_expediente"]
    date_hierarchy = "fecha_publicacion"


@admin.register(Favorito)
class FavoritoAdmin(admin.ModelAdmin):
    list_display = ["usuario", "licitacion", "created_at"]
