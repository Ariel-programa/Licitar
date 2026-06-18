from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import AlertaViewSet

router = SimpleRouter()
router.register("", AlertaViewSet, basename="alerta")
urlpatterns = [path("", include(router.urls))]
