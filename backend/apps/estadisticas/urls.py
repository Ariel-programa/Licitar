from django.urls import path
from .views import ResumenView, NotificacionesView

urlpatterns = [
    path("resumen/", ResumenView.as_view(), name="resumen"),
    path("notificaciones/", NotificacionesView.as_view(), name="notificaciones"),
]