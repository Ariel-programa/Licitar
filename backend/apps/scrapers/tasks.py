import logging
from datetime import datetime
from celery import shared_task
from apps.licitaciones.models import FuenteScraping
from .models import ScrapingJob
from .services import guardar_licitacion, scrape_url_basico

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def ejecutar_scraping(self, fuente_id: int):
    """Task principal de scraping. Delega lógica al service layer."""
    try:
        fuente = FuenteScraping.objects.get(id=fuente_id, activa=True)
    except FuenteScraping.DoesNotExist:
        logger.warning(f"Fuente {fuente_id} no existe o está inactiva")
        return

    job = ScrapingJob.objects.create(fuente=fuente, estado=ScrapingJob.Estado.CORRIENDO, iniciado_en=datetime.now())

    try:
        soup = scrape_url_basico(fuente.url_base)
        if not soup:
            raise Exception("No se pudo obtener el HTML")

        # TODO: implementar parser específico por fuente
        job.estado = ScrapingJob.Estado.COMPLETADO
        job.finalizado_en = datetime.now()
        job.save()

        fuente.ultimo_scraping = datetime.now()
        fuente.save()

    except Exception as exc:
        job.estado = ScrapingJob.Estado.FALLIDO
        job.error_mensaje = str(exc)
        job.finalizado_en = datetime.now()
        job.save()
        raise self.retry(exc=exc, countdown=60 * 5)


@shared_task
def ejecutar_todos_los_scrapers():
    """Lanza un job por cada fuente activa."""
    fuentes = FuenteScraping.objects.filter(activa=True).values_list("id", flat=True)
    for fuente_id in fuentes:
        ejecutar_scraping.delay(fuente_id)
