import api from "@/lib/api";
import type { Resumen } from "@/types";

export const getResumen = async (): Promise<Resumen> => {
  const { data } = await api.get("/estadisticas/resumen/");
  return data;
};

export type EstadisticasAvanzadas = {
  por_mes: { mes: string; total: number }[];
  top_rubros: { rubro: string; total: number }[];
  monto_total: number;
  monto_promedio: number;
};

export const getAvanzadas = async (): Promise<EstadisticasAvanzadas> => {
  const { data } = await api.get("/estadisticas/avanzadas/");
  return data;
};
