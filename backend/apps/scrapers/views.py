from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.licitaciones.models import FuenteScraping
from .models import ScrapingJob
from .serializers import ScrapingJobSerializer, FuenteScrapingSerializer
from .tasks import ejecutar_scraping

SCHEDULE_TASK_NAME = "Scraping automático de todas las fuentes"
SCHEDULE_TASK_PATH = "apps.scrapers.tasks.ejecutar_todos_los_scrapers"


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsAnalystOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "analyst")


class FuenteScrapingViewSet(viewsets.ModelViewSet):
    queryset = FuenteScraping.objects.prefetch_related("jobs").order_by("nombre")
    serializer_class = FuenteScrapingSerializer
    permission_classes = [IsAnalystOrAdmin]

    @action(detail=True, methods=["post"])
    def ejecutar(self, request, pk=None):
        fuente = self.get_object()
        if not fuente.activa:
            return Response({"error": "Fuente inactiva"}, status=400)
        try:
            ejecutar_scraping.delay(fuente.id)
            return Response({"mensaje": f"Scraping iniciado para {fuente.nombre}"})
        except Exception:
            # Redis no disponible — corre en un thread de fondo
            import threading
            thread = threading.Thread(
                target=ejecutar_scraping, args=(fuente.id,), daemon=True
            )
            thread.start()
            return Response({"mensaje": f"Scraping iniciado (modo local) para {fuente.nombre}"})

    @action(detail=False, methods=["post"], url_path="ejecutar-todas")
    def ejecutar_todas(self, request):
        from .tasks import ejecutar_todos_los_scrapers
        try:
            ejecutar_todos_los_scrapers.delay()
        except Exception:
            import threading
            threading.Thread(target=ejecutar_todos_los_scrapers, daemon=True).start()
        return Response({"mensaje": "Scraping iniciado para todas las fuentes activas"})


class ScrapingJobViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ScrapingJob.objects.select_related("fuente").order_by("-created_at")[:50]
    serializer_class = ScrapingJobSerializer
    permission_classes = [IsAnalystOrAdmin]


class ScheduleView(APIView):
    permission_classes = [IsAnalystOrAdmin]

    def get(self, request):
        try:
            from django_celery_beat.models import PeriodicTask
            task = PeriodicTask.objects.get(name=SCHEDULE_TASK_NAME)
            return Response({
                "habilitado": task.enabled,
                "intervalo_horas": task.interval.every if task.interval else None,
                "ultimo_run": task.last_run_at,
            })
        except Exception:
            return Response({"habilitado": False, "intervalo_horas": None, "ultimo_run": None})

    def patch(self, request):
        from django_celery_beat.models import PeriodicTask, IntervalSchedule
        habilitado = request.data.get("habilitado")
        intervalo_horas = request.data.get("intervalo_horas")

        if intervalo_horas is not None:
            intervalo_horas = int(intervalo_horas)
            if not (1 <= intervalo_horas <= 168):
                return Response({"error": "intervalo_horas debe estar entre 1 y 168"}, status=400)

        schedule, _ = IntervalSchedule.objects.get_or_create(
            every=intervalo_horas or 6,
            period=IntervalSchedule.HOURS,
        )
        defaults = {"interval": schedule, "task": SCHEDULE_TASK_PATH}
        if habilitado is not None:
            defaults["enabled"] = habilitado

        task, _ = PeriodicTask.objects.update_or_create(
            name=SCHEDULE_TASK_NAME,
            defaults=defaults,
        )
        return Response({
            "habilitado": task.enabled,
            "intervalo_horas": task.interval.every,
            "ultimo_run": task.last_run_at,
        })