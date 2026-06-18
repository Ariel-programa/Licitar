from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import ScrapingJobViewSet, FuenteScrapingViewSet, ScheduleView

router = SimpleRouter()
router.register("jobs", ScrapingJobViewSet, basename="scraping-job")
router.register("fuentes", FuenteScrapingViewSet, basename="fuente-scraping")

urlpatterns = [
    path("", include(router.urls)),
    path("schedule/", ScheduleView.as_view(), name="scraping-schedule"),
]
