import { useState, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getLicitaciones } from "@/services/licitaciones";
import { getFuentes, type FuenteScraping } from "@/services/scrapers";
import type { PaginatedResponse, Licitacion } from "@/types";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import {
  Search, SlidersHorizontal, X, ExternalLink, ChevronUp, ChevronDown,
  ChevronsUpDown, ArrowLeft, ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PROVINCIAS = [
  "Nacional", "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut",
  "Cordoba", "Corrientes", "Entre Rios", "Formosa", "Jujuy", "La Pampa",
  "La Rioja", "Mendoza", "Misiones", "Neuquen", "Rio Negro", "Salta",
  "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucuman",
];

const ORDENES = [
  { value: "-fecha_publicacion", label: "Publicación (más reciente)" },
  { value: "fecha_publicacion", label: "Publicación (más antigua)" },
  { value: "-fecha_apertura", label: "Apertura (más reciente)" },
  { value: "fecha_apertura", label: "Apertura (más próxima)" },
  { value: "-monto_estimado", label: "Monto (mayor a menor)" },
  { value: "monto_estimado", label: "Monto (menor a mayor)" },
  { value: "-created_at", label: "Fecha de carga (reciente)" },
];

function SortIcon({ field, ordering }: { field: string; ordering: string }) {
  if (ordering === field) return <ChevronUp size={13} className="text-blue-500" />;
  if (ordering === `-${field}`) return <ChevronDown size={13} className="text-blue-500" />;
  return <ChevronsUpDown size={13} className="text-gray-300" />;
}

function FuenteTag({ nombre }: { nombre: string }) {
  const colors: Record<string, string> = {
    "Buenos Aires Compras (BAC)": "bg-violet-50 text-violet-700 border-violet-200",
    "COMPR.AR - Portal Nacional": "bg-sky-50 text-sky-700 border-sky-200",
  };
  const cls = colors[nombre] ?? "bg-gray-50 text-gray-600 border-gray-200";
  const short = nombre.includes("BAC") ? "BAC" : nombre.includes("COMPR") ? "COMPR.AR" : nombre.slice(0, 10);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {short}
    </span>
  );
}

export default function ResultadosScrapingPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [fuente, setFuente] = useState("");
  const [provincia, setProvincia] = useState("");
  const [rubro, setRubro] = useState("");
  const [fechaPubDesde, setFechaPubDesde] = useState("");
  const [fechaPubHasta, setFechaPubHasta] = useState("");
  const [fechaAperDesde, setFechaAperDesde] = useState("");
  const [fechaAperHasta, setFechaAperHasta] = useState("");
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");
  const [ordering, setOrdering] = useState("-fecha_publicacion");
  const [page, setPage] = useState(1);
  const [avanzadoAbierto, setAvanzadoAbierto] = useState(false);

  const { data: fuentes = [] } = useQuery<FuenteScraping[]>({
    queryKey: ["fuentes-scraping"],
    queryFn: getFuentes,
  });

  const filtros = {
    search: search || undefined,
    estado: estado || undefined,
    fuente: fuente || undefined,
    provincia: provincia || undefined,
    rubro: rubro || undefined,
    fecha_publicacion_desde: fechaPubDesde || undefined,
    fecha_publicacion_hasta: fechaPubHasta || undefined,
    fecha_apertura_desde: fechaAperDesde || undefined,
    fecha_apertura_hasta: fechaAperHasta || undefined,
    monto_min: montoMin || undefined,
    monto_max: montoMax || undefined,
    ordering,
    page,
  };

  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<Licitacion>>({
    queryKey: ["resultados-scraping", filtros],
    queryFn: () => getLicitaciones(filtros),
    placeholderData: keepPreviousData,
  });

  const resetPage = useCallback(() => setPage(1), []);

  const hayFiltros = !!(search || estado || fuente || provincia || rubro ||
    fechaPubDesde || fechaPubHasta || fechaAperDesde || fechaAperHasta || montoMin || montoMax);

  const limpiar = () => {
    setSearch(""); setEstado(""); setFuente(""); setProvincia(""); setRubro("");
    setFechaPubDesde(""); setFechaPubHasta(""); setFechaAperDesde(""); setFechaAperHasta("");
    setMontoMin(""); setMontoMax(""); setOrdering("-fecha_publicacion"); setPage(1);
  };

  const toggleSort = (campo: string) => {
    setOrdering((prev) => (prev === `-${campo}` ? campo : `-${campo}`));
    setPage(1);
  };

  const totalPaginas = data ? Math.ceil(data.count / 20) : 1;

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-0.5">Módulo de scraping</p>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Resultados de licitaciones</h2>
        </div>
        {data && (
          <div className="text-right">
            <p className="text-2xl font-black text-gray-900">{data.count.toLocaleString("es-AR")}</p>
            <p className="text-xs text-gray-400">licitaciones encontradas</p>
          </div>
        )}
      </div>

      {/* Barra de filtros principales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, organismo, expediente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Estado */}
          <select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); resetPage(); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="adjudicada">Adjudicada</option>
            <option value="cerrada">Cerrada</option>
            <option value="suspendida">Suspendida</option>
            <option value="desconocido">Desconocido</option>
          </select>

          {/* Fuente */}
          <select
            value={fuente}
            onChange={(e) => { setFuente(e.target.value); resetPage(); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las fuentes</option>
            {fuentes.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>

          {/* Provincia */}
          <select
            value={provincia}
            onChange={(e) => { setProvincia(e.target.value); resetPage(); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las provincias</option>
            {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Ordenar */}
          <select
            value={ordering}
            onChange={(e) => { setOrdering(e.target.value); resetPage(); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ORDENES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Toggle filtros avanzados */}
          <button
            onClick={() => setAvanzadoAbierto((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              avanzadoAbierto
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtros avanzados
          </button>

          {hayFiltros && (
            <button
              onClick={limpiar}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
            >
              <X size={14} /> Limpiar
            </button>
          )}
        </div>

        {/* Filtros avanzados colapsables */}
        {avanzadoAbierto && (
          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* Rubro */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Rubro / Tipo</label>
              <input
                type="text"
                placeholder="Ej: medicamentos, obras..."
                value={rubro}
                onChange={(e) => { setRubro(e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fecha publicación */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Publicación desde</label>
              <input
                type="date"
                value={fechaPubDesde}
                onChange={(e) => { setFechaPubDesde(e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Publicación hasta</label>
              <input
                type="date"
                value={fechaPubHasta}
                onChange={(e) => { setFechaPubHasta(e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fecha apertura */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Apertura desde</label>
              <input
                type="date"
                value={fechaAperDesde}
                onChange={(e) => { setFechaAperDesde(e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Apertura hasta</label>
              <input
                type="date"
                value={fechaAperHasta}
                onChange={(e) => { setFechaAperHasta(e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Montos */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto mínimo ($)</label>
              <input
                type="number"
                placeholder="0"
                value={montoMin}
                onChange={(e) => { setMontoMin(e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto máximo ($)</label>
              <input
                type="number"
                placeholder="Sin límite"
                value={montoMax}
                onChange={(e) => { setMontoMax(e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-opacity ${isFetching ? "opacity-70" : ""}`}>
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">
                      <button onClick={() => toggleSort("numero_expediente")} className="flex items-center gap-1 hover:text-gray-800">
                        Expediente <SortIcon field="numero_expediente" ordering={ordering} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Título / Organismo</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Fuente</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Estado</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">
                      <button onClick={() => toggleSort("fecha_publicacion")} className="flex items-center gap-1 hover:text-gray-800">
                        Publicación <SortIcon field="fecha_publicacion" ordering={ordering} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">
                      <button onClick={() => toggleSort("fecha_apertura")} className="flex items-center gap-1 hover:text-gray-800">
                        Apertura <SortIcon field="fecha_apertura" ordering={ordering} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">
                      <button onClick={() => toggleSort("monto_estimado")} className="flex items-center gap-1 hover:text-gray-800">
                        Monto <SortIcon field="monto_estimado" ordering={ordering} />
                      </button>
                    </th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.results.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-400">
                        <Search size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Sin resultados</p>
                        <p className="text-xs mt-1">Probá con otros filtros o ejecutá un scraping desde el Dashboard</p>
                      </td>
                    </tr>
                  )}
                  {data?.results.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/licitaciones/${l.id}`)}
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap font-mono">
                        {l.numero_expediente || <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <p className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                          {l.titulo}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{l.organismo}</p>
                        {l.rubro && (
                          <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {l.rubro}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {l.fuente_nombre
                          ? <FuenteTag nombre={l.fuente_nombre} />
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3"><Badge estado={l.estado} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {l.fecha_publicacion
                          ? format(new Date(l.fecha_publicacion), "dd MMM yy", { locale: es })
                          : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {l.fecha_apertura
                          ? format(new Date(l.fecha_apertura), "dd MMM yy", { locale: es })
                          : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap font-medium">
                        {l.monto_estimado
                          ? `$${Number(l.monto_estimado).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
                          : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {l.url_original && (
                          <a
                            href={l.url_original}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver en fuente original"
                            className="text-gray-300 hover:text-blue-500 transition-colors"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data?.previous}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={14} /> Anterior
              </button>
              <span className="text-sm text-gray-500">
                Página <span className="font-semibold text-gray-800">{page}</span>
                {totalPaginas > 1 && <> de <span className="font-semibold text-gray-800">{totalPaginas}</span></>}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data?.next}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Siguiente <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
