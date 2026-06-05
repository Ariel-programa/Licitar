import api from "@/lib/api";
import type { Resumen } from "@/types";

export const getResumen = async (): Promise<Resumen> => {
  const { data } = await api.get("/estadisticas/resumen/");
  return data;
};
