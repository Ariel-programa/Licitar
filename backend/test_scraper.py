import django, os, logging
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

from apps.licitaciones.models import FuenteScraping, Licitacion
from apps.scrapers.services import scrape_buenosairescompras

fuente = FuenteScraping.objects.get(nombre__icontains="Buenos Aires")
print(f"Fuente: {fuente.nombre}")
print(f"Licitaciones antes: {Licitacion.objects.count()}")

resultado = scrape_buenosairescompras(fuente)

print(f"\nRESULTADO: {resultado}")
print(f"Licitaciones después: {Licitacion.objects.count()}")

# Mostrar algunas
for l in Licitacion.objects.filter(fuente=fuente).order_by("-created_at")[:5]:
    print(f"  [{l.estado}] {l.numero_expediente} - {l.titulo[:60]}")
