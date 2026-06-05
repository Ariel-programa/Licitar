from django.contrib import admin
from .models import Alerta, NotificacionEnviada


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "usuario", "canal", "activa", "created_at"]
    list_filter = ["canal", "activa"]


@admin.register(NotificacionEnviada)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ["alerta", "licitacion_id", "canal", "enviada_en", "exitosa"]
    list_filter = ["canal", "exitosa"]
