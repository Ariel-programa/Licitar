from django.urls import path
from .views import ResumenView, NotificacionesView, AvanzadasView

urlpatterns = [
    path("resumen/", ResumenView.as_view(), name="resumen"),
    path("notificaciones/", NotificacionesView.as_view(), name="notificaciones"),
    path("avanzadas/", AvanzadasView.as_view(), name="avanzadas"),
]