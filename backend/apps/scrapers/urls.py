from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScrapingJobViewSet, FuenteScrapingViewSet

router = DefaultRouter()
router.register("jobs", ScrapingJobViewSet, basename="scraping-job")
router.register("fuentes", FuenteScrapingViewSet, basename="fuente-scraping")

urlpatterns = [path("", include(router.urls))]
