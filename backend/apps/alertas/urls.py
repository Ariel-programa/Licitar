from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlertaViewSet

router = DefaultRouter()
router.register("", AlertaViewSet, basename="alerta")
urlpatterns = [path("", include(router.urls))]
