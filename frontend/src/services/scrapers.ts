import api from "@/lib/api";

export type FuenteScraping = {
  id: number;
  nombre: string;
  url_base: string;
  tipo: string;
  activa: boolean;
  ultimo_scraping: string | null;
  ultimo_job: {
    id: number;
    estado: string;
    total_nuevos: number;
    error_mensaje: string;
    finalizado_en: string | null;
  } | null;
};

export type Schedule = {
  habilitado: boolean;
  intervalo_horas: number | null;
  ultimo_run: string | null;
};

export const getFuentes = async (): Promise<FuenteScraping[]> =>
  (await api.get("/scrapers/fuentes/")).data.results;
export const getJobs = async () => (await api.get("/scrapers/jobs/")).data.results;
export const ejecutarScraper = (id: number) => api.post(`/scrapers/fuentes/${id}/ejecutar/`);
export const triggerFuente = (id: number) => api.post(`/scrapers/fuentes/${id}/ejecutar/`);
export const triggerAll = () => api.post("/scrapers/fuentes/ejecutar-todas/");
export const toggleFuente = (id: number, activa: boolean) =>
  api.patch(`/scrapers/fuentes/${id}/`, { activa });

export const getSchedule = async (): Promise<Schedule> =>
  (await api.get("/scrapers/schedule/")).data;
export const updateSchedule = (data: Partial<Schedule>) =>
  api.patch("/scrapers/schedule/", data);