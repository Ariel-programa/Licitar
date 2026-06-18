import api from "@/lib/api";
import type { Licitacion, PaginatedResponse } from "@/types";

export interface LicitacionFiltros {
  search?: string;
  estado?: string;
  provincia?: string;
  rubro?: string;
  fuente?: number | string;
  fecha_publicacion_desde?: string;
  fecha_publicacion_hasta?: string;
  fecha_apertura_desde?: string;
  fecha_apertura_hasta?: string;
  monto_min?: string;
  monto_max?: string;
  ordering?: string;
  page?: number;
}

export const getLicitaciones = async (filtros: LicitacionFiltros = {}): Promise<PaginatedResponse<Licitacion>> => {
  const { data } = await api.get("/licitaciones/", { params: filtros });
  return data;
};

export const getLicitacion = async (id: number): Promise<Licitacion> => {
  const { data } = await api.get(`/licitaciones/${id}/`);
  return data;
};

export const toggleFavorito = async (licitacionId: number, esFavorito: boolean) => {
  if (esFavorito) {
    const { data } = await api.get(`/licitaciones/favoritos/?licitacion_id=${licitacionId}`);
    if (data.results?.length > 0) {
      await api.delete(`/licitaciones/favoritos/${data.results[0].id}/`);
    }
  } else {
    await api.post("/licitaciones/favoritos/", { licitacion_id: licitacionId });
  }
};

export const exportarCSV = async (filtros: LicitacionFiltros = {}) => {
  const { data } = await api.get("/licitaciones/", {
    params: { ...filtros, page: 1, page_size: 10000 },
  });
  const results: Licitacion[] = data.results ?? [];

  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const headers = ["Expediente", "Título", "Organismo", "Estado", "Provincia", "Rubro",
    "Fecha publicación", "Fecha apertura", "Monto estimado", "Fuente", "URL"];

  const rows = results.map((l) => [
    esc(l.numero_expediente),
    esc(l.titulo),
    esc(l.organismo),
    l.estado,
    esc(l.provincia),
    esc(l.rubro),
    l.fecha_publicacion ?? "",
    l.fecha_apertura ?? "",
    l.monto_estimado ?? "",
    esc(l.fuente_nombre),
    esc(l.url_original),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `licitaciones_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
