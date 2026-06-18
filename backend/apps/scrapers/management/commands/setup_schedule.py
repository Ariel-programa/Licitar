from django.core.management.base import BaseCommand
from django_celery_beat.models import PeriodicTask, IntervalSchedule

TAREAS = [
    {
        "name": "Scraping automático de todas las fuentes",
        "task": "apps.scrapers.tasks.ejecutar_todos_los_scrapers",
        "horas": 6,
    },
    {
        "name": "Procesar alertas por email",
        "task": "apps.alertas.tasks.procesar_alertas",
        "horas": 6,
    },
]


class Command(BaseCommand):
    help = "Crea las tareas periódicas de scraping y alertas si no existen"

    def handle(self, *args, **options):
        for t in TAREAS:
            schedule, _ = IntervalSchedule.objects.get_or_create(
                every=t["horas"],
                period=IntervalSchedule.HOURS,
            )
            task, created = PeriodicTask.objects.get_or_create(
                name=t["name"],
                defaults={
                    "interval": schedule,
                    "task": t["task"],
                    "enabled": True,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"Tarea creada: cada {t['horas']}h → {t['task']}"
                ))
            else:
                self.stdout.write(f"Ya existe: {task.name} (habilitada={task.enabled})")
