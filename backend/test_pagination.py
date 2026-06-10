import django, os, logging
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

BASE = "https://www.buenosairescompras.gob.ar"
GRID_ID = "ctl00$CPH1$GridListaPliegos"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto(BASE, timeout=60000)
    page.wait_for_load_state("networkidle", timeout=20000)

    page.goto(BASE + "/ListarAperturaUltimos30Dias.aspx", timeout=60000)
    page.wait_for_load_state("networkidle", timeout=20000)
    page.wait_for_timeout(1000)

    print("Pag 1 URL:", page.url)
    soup = BeautifulSoup(page.content(), "lxml")
    tabla = next((t for t in soup.find_all("table") if t.find("th")), None)
    filas = tabla.find_all("tr")[1:] if tabla else []
    print(f"Filas pag 1: {len(filas)}")
    if filas:
        cells = [td.get_text(strip=True)[:40] for td in filas[0].find_all("td")]
        print("Primera fila:", cells)

    # Navegar a pagina 2 con expect_navigation
    print("\nNavegando a pag 2...")
    with page.expect_navigation(timeout=20000):
        page.evaluate(f"__doPostBack('{GRID_ID}', 'Page$2')")

    page.wait_for_timeout(500)
    print("Pag 2 URL:", page.url)
    soup2 = BeautifulSoup(page.content(), "lxml")
    tabla2 = next((t for t in soup2.find_all("table") if t.find("th")), None)
    filas2 = tabla2.find_all("tr")[1:] if tabla2 else []
    print(f"Filas pag 2: {len(filas2)}")
    if filas2:
        cells = [td.get_text(strip=True)[:40] for td in filas2[0].find_all("td")]
        print("Primera fila pag 2:", cells)

    browser.close()
    print("\nOK - paginacion funciona")
