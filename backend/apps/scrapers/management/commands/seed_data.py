from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import random
from apps.licitaciones.models import Licitacion, FuenteScraping
from apps.scrapers.services import generar_hash

LICITACIONES = [
    ("Adquisicion de medicamentos oncologicos", "Hospital Garrahan", "abierta", "CABA", "Nacional"),
    ("Provision de insumos quirurgicos descartables", "Hospital Italiano de Buenos Aires", "abierta", "CABA", "Nacional"),
    ("Compra de equipos de tomografia computada", "Ministerio de Salud Bonaerense", "abierta", "Buenos Aires", "Buenos Aires"),
    ("Suministro de reactivos para laboratorio clinico", "Hospital Zonal Bahia Blanca", "cerrada", "Buenos Aires", "Buenos Aires"),
    ("Provision de oxigeno medicinal a granel", "PAMI - Prestaciones Medicas", "abierta", "Nacional", "Nacional"),
    ("Adquisicion de protesis ortopedicas y traumatologicas", "Hospital El Cruce", "adjudicada", "Buenos Aires", "Buenos Aires"),
    ("Compra de equipos de hemodinamia", "Clinica y Maternidad Suizo Argentina", "abierta", "CABA", "Nacional"),
    ("Provision de vacunas contra influenza estacional", "Ministerio de Salud de la Nacion", "cerrada", "Nacional", "Nacional"),
    ("Suministro de material de sutura", "Sanatorio Guemes", "abierta", "CABA", "Nacional"),
    ("Adquisicion de monitores multiparametros UCI", "Hospital Privado Universitario Cordoba", "abierta", "Cordoba", "Cordoba"),
    ("Provision de farmacia hospitalaria ambulatoria", "Obra Social del Personal Docente", "cerrada", "Santa Fe", "Santa Fe"),
    ("Compra de equipos de ventilacion mecanica", "Hospital Angel Cruz Padilla", "adjudicada", "Tucuman", "Tucuman"),
    ("Suministro de descartables para hemodialisis", "Clinica de Nefrologia Mendoza", "abierta", "Mendoza", "Mendoza"),
    ("Adquisicion de solucion fisiologica y dextrosa", "Hospital Padilla Tucuman", "abierta", "Tucuman", "Tucuman"),
    ("Provision de equipos de radiologia digital", "Hospital Regional Rio Negro", "cerrada", "Rio Negro", "Rio Negro"),
    ("Compra de kits de diagnostico COVID-19 y respiratorios", "Laboratorio Provincial Neuquen", "cerrada", "Neuquen", "Neuquen"),
    ("Suministro de material de esterilizacion autoclave", "Sanatorio Allende Cordoba", "abierta", "Cordoba", "Cordoba"),
    ("Adquisicion de implantes cardiovasculares", "Instituto Cardiovascular Buenos Aires", "adjudicada", "CABA", "Nacional"),
    ("Provision de anestesicos generales e inhalatorios", "Clinica Privada Tucuman", "abierta", "Tucuman", "Tucuman"),
    ("Compra de equipos de ecografia portatil", "Centro de Salud Municipal Rosario", "abierta", "Santa Fe", "Santa Fe"),
    ("Suministro de medicamentos para VIH SIDA", "Programa Nacional ITS Sida", "cerrada", "Nacional", "Nacional"),
    ("Adquisicion de camillas y sillones de infusion", "Hospital General Agudos J.M. Ramos Mejia", "abierta", "CABA", "Nacional"),
    ("Provision de reactivos hematologicos analizadores", "Hospital de Ninos Ricardo Gutierrez", "adjudicada", "CABA", "Nacional"),
    ("Compra de lentes intraoculares y material oftalmologico", "Clinica de Ojos San Martin", "abierta", "Buenos Aires", "Buenos Aires"),
    ("Suministro de insulinas y dispositivos diabetes", "Ministerio de Salud Santa Fe", "abierta", "Santa Fe", "Santa Fe"),
    ("Adquisicion de equipos de laboratorio bioquimico", "OSECAC Obra Social Empleados Comercio", "cerrada", "CABA", "Nacional"),
    ("Provision de material radiologico y contrastes", "Clinica Radiologica Mendoza", "abierta", "Mendoza", "Mendoza"),
    ("Compra de sillas de ruedas y ayudas tecnicas", "ANDIS Agencia Nacional Discapacidad", "adjudicada", "Nacional", "Nacional"),
    ("Suministro de guantes quirurgicos y de examen", "Hospital Provincial Misiones", "abierta", "Misiones", "Misiones"),
    ("Adquisicion de equipos de fisioterapia y rehabilitacion", "Centro de Rehabilitacion Salta", "abierta", "Salta", "Salta"),
]

RUBROS = ["Medicamentos", "Equipamiento", "Insumos", "Reactivos", "Servicios Medicos"]

EXPEDIENTES = [
    "EX-2026-{:06d}-APN-MSG#MS", "LPR-{}/2026", "LP-{:04d}/2026",
    "EX-GCBA-{:05d}/2026", "LIC-{:04d}-2026"
]


class Command(BaseCommand):
    help = "Carga datos de ejemplo de licitaciones de salud"

    def handle(self, *args, **options):
        fuente, _ = FuenteScraping.objects.get_or_create(
            url_base="https://comprar.gob.ar",
            defaults={"nombre": "Seed Data", "tipo": "portal", "activa": True},
        )

        creadas = 0
        hoy = date.today()

        for i, (titulo, organismo, estado, provincia, pcia_model) in enumerate(LICITACIONES):
            offset_pub = random.randint(-60, -1)
            offset_ap = random.randint(5, 45)
            fecha_pub = hoy + timedelta(days=offset_pub)
            fecha_ap = fecha_pub + timedelta(days=offset_ap)

            monto = random.choice([None, None,
                round(random.uniform(500_000, 50_000_000), -3)])

            exp_template = EXPEDIENTES[i % len(EXPEDIENTES)]
            nro = exp_template.format(100000 + i * 37, 100000 + i * 37)

            hash_val = generar_hash(titulo, organismo, str(fecha_pub))
            if Licitacion.objects.filter(hash_contenido=hash_val).exists():
                continue

            Licitacion.objects.create(
                fuente=fuente,
                hash_contenido=hash_val,
                titulo=titulo,
                organismo=organismo,
                estado=estado,
                provincia=pcia_model,
                numero_expediente=nro,
                fecha_publicacion=fecha_pub,
                fecha_apertura=fecha_ap if estado == "abierta" else fecha_pub + timedelta(days=offset_ap),
                monto_estimado=monto,
                rubro=RUBROS[i % len(RUBROS)],
                url_original="https://comprar.gob.ar",
            )
            creadas += 1

        self.stdout.write(self.style.SUCCESS(f"{creadas} licitaciones de ejemplo creadas."))
