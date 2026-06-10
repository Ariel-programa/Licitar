import logging
from datetime import datetime
from celery import shared_task
from apps.licitaciones.models import FuenteScraping
from .models import ScrapingJob
from .services import scrape_comprar, scrape_buenosairescompras, scrape_url_basico

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def ejecutar_scraping(self, fuente_id: int):
    try:
        fuente = FuenteScraping.objects.get(id=fuente_id, activa=True)
    except FuenteScraping.DoesNotExist:
        return

    job = ScrapingJob.objects.create(
        fuente=fuente,
        estado=ScrapingJob.Estado.CORRIENDO,
        iniciado_en=datetime.now(),
    )

    try:
        url = fuente.url_base.lower()
        if "comprar.gob.ar" in url:
            resultado = scrape_comprar(fuente)
        elif "buenosairescompras.gob.ar" in url:
            resultado = scrape_buenosairescompras(fuente)
        else:
            resultado = scrape_url_basico(fuente)

        job.total_nuevos = resultado["nuevas"]
        job.total_duplicados = resultado["duplicados"]
        job.total_encontrados = resultado["nuevas"] + resultado["duplicados"] + resultado.get("omitidas", 0)
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
