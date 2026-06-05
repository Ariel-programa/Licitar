"""
Scraping service layer.
Toda lógica de negocio de scraping vive aquí, no en las tasks o views.
"""
import hashlib
import logging
from datetime import datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup

from apps.licitaciones.models import Licitacion, FuenteScraping

logger = logging.getLogger(__name__)


def generar_hash(titulo: str, organismo: str, fecha: Optional[str] = None) -> str:
    contenido = f"{titulo.lower().strip()}|{organismo.lower().strip()}|{fecha or ''}"
    return hashlib.sha256(contenido.encode()).hexdigest()


def guardar_licitacion(data: dict, fuente: FuenteScraping) -> tuple[bool, bool]:
    """
    Guarda una licitación evitando duplicados.
    Retorna (creada: bool, duplicado: bool)
    """
    hash_val = generar_hash(data.get("titulo", ""), data.get("organismo", ""), str(data.get("fecha_publicacion")))

    if Licitacion.objects.filter(hash_contenido=hash_val).exists():
        return False, True

    Licitacion.objects.create(
        fuente=fuente,
        hash_contenido=hash_val,
        **data,
    )
    return True, False


def scrape_url_basico(url: str) -> Optional[BeautifulSoup]:
    """Fetch y parse HTML básico. Para scraping dinámico usar Playwright."""
    try:
        resp = requests.get(url, timeout=30, headers={"User-Agent": "LicitAR/1.0"})
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        logger.error(f"Error scraping {url}: {e}")
        return None
