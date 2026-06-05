export interface User {
  id: number;
  email: string;
  username: string;
  role: "admin" | "analyst" | "viewer";
  empresa: string;
}

export interface Licitacion {
  id: number;
  numero_expediente: string;
  titulo: string;
  descripcion: string;
  organismo: string;
  estado: "abierta" | "cerrada" | "adjudicada" | "suspendida" | "desconocido";
  fecha_publicacion: string | null;
  fecha_apertura: string | null;
  monto_estimado: string | null;
  url_original: string;
  url_pliego: string;
  provincia: string;
  rubro: string;
  fuente_nombre: string;
  es_favorito: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Alerta {
  id: number;
  nombre: string;
  palabras_clave: string;
  provincia: string;
  rubro: string;
  canal: "email" | "telegram";
  activa: boolean;
  created_at: string;
}

export interface Resumen {
  total: number;
  abiertas: number;
  cerradas: number;
  adjudicadas: number;
  por_provincia: { provincia: string; total: number }[];
  por_estado: { estado: string; total: number }[];
}
