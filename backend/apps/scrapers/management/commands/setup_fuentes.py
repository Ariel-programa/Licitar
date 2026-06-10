from django.core.management.base import BaseCommand
from apps.licitaciones.models import FuenteScraping


FUENTES = [
    {
        "nombre": "Buenos Aires Compras (BAC)",
        "url_base": "https://www.buenosairescompras.gob.ar",
        "tipo": "portal",
    },
    {
        "nombre": "COMPR.AR - Portal Nacional",
        "url_base": "https://comprar.gob.ar/Compras.aspx?qs=W1HXHGHtH10%3D",
        "tipo": "portal",
    },
]


class Command(BaseCommand):
    help = "Crea las fuentes de scraping predefinidas (BAC, COMPR.AR)"

    def handle(self, *args, **options):
        for f in FUENTES:
            obj, created = FuenteScraping.objects.get_or_create(
                url_base=f["url_base"],
                defaults={"nombre": f["nombre"], "tipo": f["tipo"], "activa": True},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Creada: {obj.nombre}"))
            else:
                self.stdout.write(f"Ya existe: {obj.nombre} (id={obj.id})")
