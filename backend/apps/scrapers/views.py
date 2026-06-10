from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ScrapingJob
from .serializers import ScrapingJobSerializer, FuenteScrapingSerializer
from apps.licitaciones.models import FuenteScraping
from .tasks import ejecutar_scraping, ejecutar_todos_los_scrapers


class ScrapingJobViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ScrapingJobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ScrapingJob.objects.select_related("fuente").order_by("-created_at")[:100]


class FuenteScrapingViewSet(viewsets.ModelViewSet):
    queryset = FuenteScraping.objects.all().order_by("nombre")
    serializer_class = FuenteScrapingSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="trigger")
    def trigger(self, request, pk=None):
        fuente = self.get_object()
        if not fuente.activa:
            return Response({"error": "La fuente está inactiva."}, status=status.HTTP_400_BAD_REQUEST)
        task = ejecutar_scraping.delay(fuente.id)
        return Response(
            {"task_id": task.id, "fuente_id": fuente.id, "fuente_nombre": fuente.nombre},
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=False, methods=["post"], url_path="trigger-all")
    def trigger_all(self, request):
        task = ejecutar_todos_los_scrapers.delay()
        return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)
