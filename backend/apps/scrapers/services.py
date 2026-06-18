"""
Scraping service layer - usa Playwright para páginas con JavaScript.
"""
import hashlib
import logging
import re
from datetime import date
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

_ESTADO_BAC = {
    "publicada": "abierta",
    "abierta": "abierta",
    "vigente": "abierta",
    "adjudicada": "adjudicada",
    "cerrada": "cerrada",
    "finalizada": "cerrada",
    "desierta": "cerrada",
    "fracasada": "cerrada",
    "suspendida": "suspendida",
    "cancelada": "cerrada",
    "revocada": "cerrada",
}


def _parse_fecha(s: str) -> Optional[date]:
    if not s:
        return None
    m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{2,4})", s)
    if m:
        try:
            d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if y < 100:
                y += 2000
            return date(y, mo, d)
        except (ValueError, OverflowError):
            pass
    return None


def _parse_monto(s: str) -> Optional[float]:
    if not s:
        return None
    cleaned = re.sub(r"[^\d,.]", "", s).replace(".", "").replace(",", ".")
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


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
    """
    Scraper de COMPR.AR - ASP.NET WebForms con paginación por postback.

    Columnas reales: Número de Proceso | Nombre | Tipo | Fecha Apertura | Estado | Unidad Ejecutora | SAF
    """
    from playwright.sync_api import sync_playwright
    from bs4 import BeautifulSoup

    # El grid en COMPR.AR usa este ID para los postbacks de paginación
    GRID_ID = "ctl00$CPH1$GridListaPliegosAperturaProxima"
    MAX_PAGES = 50

    nuevas = 0
    duplicados = 0
    omitidas = 0

    def _extraer_filas(soup: BeautifulSoup) -> list:
        tabla = (
            soup.find("table", id=lambda x: x and "GridListaPliegos" in x)
            or next(
                (t for t in soup.find_all("table")
                 if any("proceso" in th.get_text(strip=True).lower() for th in t.find_all("th"))),
                None,
            )
        )
        if not tabla:
            return []
        filas = []
        for row in tabla.find_all("tr")[1:]:
            cells = row.find_all("td")
            if len(cells) < 5:
                continue
            texts = [c.get_text(" ", strip=True) for c in cells]
            filas.append({
                "numero_expediente": texts[0][:200],
                "titulo": texts[1][:500],
                "rubro": texts[2][:200],
                "fecha_ap_raw": texts[3],
                "estado_raw": texts[4],
                "organismo": (texts[5] if len(texts) > 5 else "")[:300],
            })
        return filas

    # ── Fase 1: recolección con Playwright (sin ORM) ──────────────────────
    datos_crudos: list = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        pw_page = context.new_page()

        try:
            pw_page.goto(fuente.url_base, timeout=60000)
            pw_page.wait_for_load_state("networkidle", timeout=30000)
            pw_page.wait_for_selector("table", timeout=20000)

            pagina_actual = 1
            while pagina_actual <= MAX_PAGES:
                soup = BeautifulSoup(pw_page.content(), "lxml")
                filas = _extraer_filas(soup)
                datos_crudos.extend(filas)
                logger.info(f"COMPR.AR pág {pagina_actual}: {len(filas)} filas")

                siguiente = pagina_actual + 1
                tiene_siguiente = bool(soup.find("a", href=lambda h: h and f"Page${siguiente}" in h))
                if not tiene_siguiente:
                    break

                try:
                    with pw_page.expect_navigation(timeout=20000):
                        pw_page.evaluate(f"__doPostBack('{GRID_ID}', 'Page${siguiente}')")
                    pw_page.wait_for_timeout(300)
                    pagina_actual += 1
                except Exception as exc:
                    logger.warning(f"COMPR.AR: error navegando a pág {siguiente}: {exc}")
                    break

        except Exception as exc:
            logger.error(f"COMPR.AR: error en Playwright: {exc}")
            raise
        finally:
            browser.close()

    logger.info(f"COMPR.AR: {len(datos_crudos)} filas recolectadas, persistiendo...")

    # ── Fase 2: filtro y persistencia con Django ORM ──────────────────────
    _ESTADO_MAP = {
        "abierta": "abierta",
        "vigente": "abierta",
        "apertura": "abierta",
        "publicada": "abierta",
        "adjudicada": "adjudicada",
        "cerrada": "cerrada",
        "finalizada": "cerrada",
        "desierta": "cerrada",
        "fracasada": "cerrada",
        "suspendida": "suspendida",
    }

    for fila in datos_crudos:
        titulo = fila.get("titulo", "")
        if not titulo:
            omitidas += 1
            continue

        titulo_lower = titulo.lower()
        organismo_lower = fila.get("organismo", "").lower()
        if not any(k in titulo_lower or k in organismo_lower for k in KEYWORDS_SALUD):
            omitidas += 1
            continue

        estado_txt = fila["estado_raw"].lower()
        estado = next((v for k, v in _ESTADO_MAP.items() if k in estado_txt), "desconocido")

        try:
            data = {
                "titulo": titulo,
                "organismo": fila["organismo"],
                "estado": estado,
                "provincia": "Nacional",
                "numero_expediente": fila["numero_expediente"],
                "url_original": fuente.url_base,
                "fecha_apertura": _parse_fecha(fila["fecha_ap_raw"]),
                "rubro": fila["rubro"],
            }
            creada, dup = guardar_licitacion(data, fuente)
            if creada:
                nuevas += 1
            elif dup:
                duplicados += 1
        except Exception as exc:
            logger.warning(f"COMPR.AR: error guardando fila: {exc}")
            omitidas += 1

    logger.info(f"COMPR.AR TOTAL: {nuevas} nuevas, {duplicados} duplicados, {omitidas} omitidas")
    return {"nuevas": nuevas, "duplicados": duplicados, "omitidas": omitidas}


def scrape_buenosairescompras(fuente: FuenteScraping) -> dict:
    """
    Scraper para Buenos Aires Compras (BAC) del GCBA.

    Estructura real del sitio:
    - Columnas: Número de Proceso | Nombre de Proceso | Tipo de Proceso | Fecha de Apertura | Estado | Unidad Ejecutora
    - Paginación via ASP.NET __doPostBack
    - Requiere cargar la homepage primero para obtener la cookie de sesión ASP.NET
    """
    from playwright.sync_api import sync_playwright
    from bs4 import BeautifulSoup

    BAC_BASE = "https://www.buenosairescompras.gob.ar"
    LISTING_PAGES = [
        "/ListarAperturaUltimos30Dias.aspx",
        "/ListarAperturaProxima.aspx",
    ]
    GRID_ID = "ctl00$CPH1$GridListaPliegos"
    MAX_PAGES = 200  # tope de seguridad (~2400 filas)

    _ESTADO_MAP = {
        "en apertura": "abierta",
        "publicado": "abierta",
        "publicada": "abierta",
        "adjudicado": "adjudicada",
        "adjudicada": "adjudicada",
        "desierto": "cerrada",
        "desierta": "cerrada",
        "fracasado": "cerrada",
        "fracasada": "cerrada",
        "finalizado": "cerrada",
        "finalizada": "cerrada",
        "cerrado": "cerrada",
        "cerrada": "cerrada",
        "suspendido": "suspendida",
        "suspendida": "suspendida",
        "revocado": "cerrada",
    }

    nuevas = 0
    duplicados = 0
    omitidas = 0

    def _mapear_estado(txt: str) -> str:
        t = txt.strip().lower()
        for k, v in _ESTADO_MAP.items():
            if k in t:
                return v
        return "desconocido"

    def _extraer_filas_de_tabla(soup: BeautifulSoup, url_base: str) -> list:
        """Extrae los datos crudos de la tabla SIN tocar el ORM."""
        filas = []
        tabla = soup.find("table", id=lambda x: x and "GridListaPliegos" in x) or \
                next((t for t in soup.find_all("table")
                      if any("proceso" in th.get_text(strip=True).lower() for th in t.find_all("th"))), None)
        if not tabla:
            return filas
        for row in tabla.find_all("tr")[1:]:
            cells = row.find_all("td")
            if len(cells) < 5:
                continue
            texts = [c.get_text(" ", strip=True) for c in cells]
            filas.append({
                "numero_expediente": texts[0][:200],
                "titulo": texts[1][:500],
                "rubro": texts[2][:200],
                "fecha_ap_raw": texts[3],
                "estado_raw": texts[4],
                "organismo": (texts[5] if len(texts) > 5 else "")[:300],
                "url_original": url_base,
            })
        return filas

    # ── Fase 1: recolección con Playwright (sin ORM) ──────────────────────
    datos_crudos: list = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        pw_page = context.new_page()

        try:
            # Establecer cookie de sesión ASP.NET cargando la homepage
            logger.info("BAC: estableciendo sesión desde homepage...")
            pw_page.goto(BAC_BASE, timeout=60000)
            pw_page.wait_for_load_state("networkidle", timeout=20000)

            for listing_path in LISTING_PAGES:
                listing_url = BAC_BASE + listing_path
                logger.info(f"BAC: scrapeando {listing_url}")

                pw_page.goto(listing_url, timeout=60000)
                pw_page.wait_for_load_state("networkidle", timeout=20000)
                pw_page.wait_for_timeout(1000)

                if "Default.aspx" in pw_page.url:
                    logger.warning(f"BAC: {listing_path} redirigió al login, saltando")
                    continue

                pagina_actual = 1
                while pagina_actual <= MAX_PAGES:
                    soup = BeautifulSoup(pw_page.content(), "lxml")
                    filas = _extraer_filas_de_tabla(soup, listing_url)
                    datos_crudos.extend(filas)
                    logger.info(f"BAC {listing_path} pág {pagina_actual}: {len(filas)} filas extraídas")

                    # Buscar link a la siguiente página
                    siguiente = pagina_actual + 1
                    tiene_siguiente = bool(soup.find("a", href=lambda h: h and f"Page${siguiente}" in h))
                    if not tiene_siguiente:
                        logger.info(f"BAC: fin de {listing_path} en pág {pagina_actual}")
                        break

                    try:
                        with pw_page.expect_navigation(timeout=20000):
                            pw_page.evaluate(f"__doPostBack('{GRID_ID}', 'Page${siguiente}')")
                        pw_page.wait_for_timeout(300)
                        pagina_actual += 1
                    except Exception as exc:
                        logger.warning(f"BAC: error navegando a pág {siguiente}: {exc}")
                        break

        except Exception as exc:
            logger.error(f"BAC: error en Playwright: {exc}")
            raise
        finally:
            browser.close()

    logger.info(f"BAC: {len(datos_crudos)} filas recolectadas, persistiendo...")

    # ── Fase 2: persistencia con Django ORM (fuera del contexto Playwright) ──
    for fila in datos_crudos:
        if not fila.get("titulo"):
            omitidas += 1
            continue
        try:
            data = {
                "titulo": fila["titulo"],
                "organismo": fila["organismo"],
                "estado": _mapear_estado(fila["estado_raw"]),
                "provincia": "Buenos Aires",
                "numero_expediente": fila["numero_expediente"],
                "url_original": fila["url_original"],
                "fecha_apertura": _parse_fecha(fila["fecha_ap_raw"]),
                "rubro": fila["rubro"],
            }
            creada, dup = guardar_licitacion(data, fuente)
            if creada:
                nuevas += 1
            elif dup:
                duplicados += 1
        except Exception as exc:
            logger.warning(f"BAC: error guardando fila: {exc}")
            omitidas += 1

    logger.info(f"BAC TOTAL: {nuevas} nuevas, {duplicados} duplicados, {omitidas} omitidas")
    return {"nuevas": nuevas, "duplicados": duplicados, "omitidas": omitidas}


def scrape_url_basico(fuente: FuenteScraping) -> dict:
    """Scraper genérico para páginas estáticas (sin JavaScript)."""
    import requests
    from bs4 import BeautifulSoup

    nuevas = 0
    duplicados = 0
    omitidas = 0

    try:
        resp = requests.get(
            fuente.url_base,
            timeout=30,
            headers={"User-Agent": "Mozilla/5.0 (compatible; LicitAR/1.0)"},
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:]:
                cells = row.find_all("td")
                if len(cells) < 2:
                    continue
                try:
                    texts = [c.get_text(strip=True) for c in cells]
                    titulo = texts[1] if len(texts) > 1 else texts[0]
                    organismo = texts[2] if len(texts) > 2 else ""
                    if not titulo:
                        continue
                    link = row.find("a")
                    url_det = ""
                    if link and link.get("href"):
                        href = link["href"]
                        url_det = href if href.startswith("http") else f"{fuente.url_base.rstrip('/')}/{href.lstrip('/')}"
                    data = {
                        "titulo": titulo[:500],
                        "organismo": organismo[:300],
                        "estado": "desconocido",
                        "provincia": "",
                        "url_original": url_det or fuente.url_base,
                    }
                    creada, dup = guardar_licitacion(data, fuente)
                    if creada:
                        nuevas += 1
                    elif dup:
                        duplicados += 1
                except Exception as e:
                    logger.warning(f"scrape_url_basico: error en fila: {e}")
                    omitidas += 1
    except Exception as e:
        logger.error(f"scrape_url_basico: error cargando {fuente.url_base}: {e}")
        raise

    return {"nuevas": nuevas, "duplicados": duplicados, "omitidas": omitidas}