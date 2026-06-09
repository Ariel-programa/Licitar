from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LicitacionViewSet, FavoritoViewSet, FuenteViewSet

router = DefaultRouter()
router.register("favoritos", FavoritoViewSet, basename="favorito")
router.register("fuentes", FuenteViewSet, basename="fuente")
router.register("", LicitacionViewSet, basename="licitacion")

urlpatterns = [path("", include(router.urls))]