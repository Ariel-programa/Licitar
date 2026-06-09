"""
Scraping service layer - usa Playwright para páginas con JavaScript.
"""
import hashlib
import logging
from typing import Optional
from apps.licitaciones.models import Licitacion, FuenteScraping

logger = logging.getLogger(__name__)

KEYWORDS_SALUD = [
    "medic", "farmac", "drogu", "hospital", "salud", "sanitari",
    "insumo", "equipo medico", "quirurg", "clinic", "laboratori",
    "reactivo", "descartable", "oxigeno", "ambulancia", "enferm",
    "prótesis", "ortopedi", "radiolog", "tomograf", "resonanci",
    "vacuna", "medicamento", "anestesi", "cirugi", "dental",
]


def generar_hash(titulo: str, organismo: str, fecha: Optional[str] = None) -> str:
    contenido = f"{titulo.lower().strip()}|{organismo.lower().strip()}|{fecha or ''}"
    return hashlib.sha256(contenido.encode()).hexdigest()


def guardar_licitacion(data: dict, fuente: FuenteScraping) -> tuple:
    hash_val = generar_hash(data.get("titulo", ""), data.get("organismo", ""), str(data.get("fecha_publicacion")))
    if Licitacion.objects.filter(hash_contenido=hash_val).exists():
        return False, True
    Licitacion.objects.create(fuente=fuente, hash_contenido=hash_val, **data)
    return True, False


def scrape_comprar(fuente: FuenteScraping) -> dict:
    """Scraper de COMPR.AR usando Playwright para cargar JavaScript."""
    from playwright.sync_api import sync_playwright

    nuevas = 0
    duplicados = 0
    omitidas = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto("https://comprar.gob.ar/Compras.aspx?qs=W1HXHGHtH10%3D", timeout=60000)
            page.wait_for_load_state("networkidle", timeout=30000)

            # Esperar que aparezca la tabla
            page.wait_for_selector("table", timeout=20000)

            filas = page.query_selector_all("table tr")
            logger.info(f"Filas encontradas: {len(filas)}")

            for fila in filas[1:]:
                celdas = fila.query_selector_all("td")
                if len(celdas) < 3:
                    continue

                try:
                    titulo = celdas[1].inner_text().strip() if len(celdas) > 1 else ""
                    organismo = celdas[2].inner_text().strip() if len(celdas) > 2 else ""
                    estado_txt = celdas[3].inner_text().strip().lower() if len(celdas) > 3 else ""

                    if not titulo:
                        continue

                    # Filtrar solo salud
                    titulo_lower = titulo.lower()
                    organismo_lower = organismo.lower()
                    es_salud = any(k in titulo_lower or k in organismo_lower for k in KEYWORDS_SALUD)

                    if not es_salud:
                        omitidas += 1
                        continue

                    # Mapear estado
                    if "abierta" in estado_txt or "vigente" in estado_txt:
                        estado = "abierta"
                    elif "adjudicada" in estado_txt:
                        estado = "adjudicada"
                    elif "cerrada" in estado_txt or "finalizada" in estado_txt:
                        estado = "cerrada"
                    else:
                        estado = "desconocido"

                    data = {
                        "titulo": titulo[:500],
                        "organismo": organismo[:300],
                        "estado": estado,
                        "provincia": "Nacional",
                        "url_original": "https://comprar.gob.ar",
                    }

                    creada, dup = guardar_licitacion(data, fuente)
                    if creada:
                        nuevas += 1
                    elif dup:
                        duplicados += 1

                except Exception as e:
                    logger.warning(f"Error procesando fila: {e}")
                    continue

        finally:
            browser.close()

    logger.info(f"COMPR.AR: {nuevas} nuevas, {duplicados} duplicados, {omitidas} omitidas")
    return {"nuevas": nuevas, "duplicados": duplicados, "omitidas": omitidas}