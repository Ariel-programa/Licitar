import api from "@/lib/api";

export interface FuenteScraping {
  id: number;
  nombre: string;
  url_base: string;
  tipo: string;
  activa: boolean;
  ultimo_scraping: string | null;
  created_at: string;
  ultimo_job: {
    estado: string;
    total_nuevos: number;
    finalizado_en: string | null;
    error_mensaje: string;
  } | null;
}

export interface ScrapingJob {
  id: number;
  fuente: number;
  fuente_nombre: string;
  estado: "pendiente" | "corriendo" | "completado" | "fallido";
  iniciado_en: string | null;
  finalizado_en: string | null;
  duracion_segundos: number | null;
  total_encontrados: number;
  total_nuevos: number;
  total_duplicados: number;
  error_mensaje: string;
  created_at: string;
}

export const getFuentes = (): Promise<FuenteScraping[]> =>
  api.get("/scrapers/fuentes/").then((r) => r.data.results ?? r.data);

export const getJobs = (): Promise<ScrapingJob[]> =>
  api.get("/scrapers/jobs/").then((r) => r.data.results ?? r.data);

export const triggerFuente = (id: number) =>
  api.post(`/scrapers/fuentes/${id}/trigger/`).then((r) => r.data);

export const triggerAll = () =>
  api.post("/scrapers/fuentes/trigger-all/").then((r) => r.data);
