import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getLicitaciones, toggleFavorito, exportarCSV } from "@/services/licitaciones";
import { toast } from "@/lib/toastStore";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import { Search, Star, SlidersHorizontal, X, ChevronDown, ChevronUp, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useIsEditor } from "@/lib/authStore";

const PROVINCIAS = [
  "Nacional", "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut",
  "Cordoba", "Corrientes", "Entre Rios", "Formosa", "Jujuy", "La Pampa",
  "La Rioja", "Mendoza", "Misiones", "Neuquen", "Rio Negro", "Salta",
  "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucuman",
];

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "abierta", label: "Abierta" },
  { value: "cerrada", label: "Cerrada" },
  { value: "adjudicada", label: "Adjudicada" },
  { value: "suspendida", label: "Suspendida" },
];

const ORDEN_OPTS = [
  { value: "-fecha_publicacion", label: "Publicación (más reciente)" },
  { value: "fecha_publicacion", label: "Publicación (más antigua)" },
  { value: "fecha_apertura", label: "Apertura (más próxima)" },
  { value: "-fecha_apertura", label: "Apertura (más lejana)" },
  { value: "-monto_estimado", label: "Mayor monto" },
  { value: "monto_estimado", label: "Menor monto" },
];

const inputCls =
  "w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 dark:placeholder:text-gray-500";

const selectCls =
  "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

export default function LicitacionesPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [estado, setEstado] = useState("");
  const [provincia, setProvincia] = useState("");
  const [rubro, setRubro] = useState("");
  const [fechaPubDesde, setFechaPubDesde] = useState("");
  const [fechaPubHasta, setFechaPubHasta] = useState("");
  const [fechaApDesde, setFechaApDesde] = useState("");
  const [fechaApHasta, setFechaApHasta] = useState("");
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");
  const [ordering, setOrdering] = useState("-fecha_publicacion");
  const [avanzado, setAvanzado] = useState(false);
  const [page, setPage] = useState(1);
  const [exportando, setExportando] = useState(false);

  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEditor = useIsEditor();

  const hayFiltros = !!(search || estado || provincia || rubro || fechaPubDesde ||
    fechaPubHasta || fechaApDesde || fechaApHasta || montoMin || montoMax);

  const { data, isLoading } = useQuery({
    queryKey: ["licitaciones", { search, estado, provincia, rubro, fechaPubDesde, fechaPubHasta, fechaApDesde, fechaApHasta, montoMin, montoMax, ordering, page }],
    queryFn: () => getLicitaciones({
      search: search || undefined,
      estado: estado || undefined,
      provincia: provincia || undefined,
      rubro: rubro || undefined,
      fecha_publicacion_desde: fechaPubDesde || undefined,
      fecha_publicacion_hasta: fechaPubHasta || undefined,
      fecha_apertura_desde: fechaApDesde || undefined,
      fecha_apertura_hasta: fechaApHasta || undefined,
      monto_min: montoMin || undefined,
      monto_max: montoMax || undefined,
      ordering,
      page,
    }),
  });

  const favMutation = useMutation({
    mutationFn: ({ id, esFavorito }: { id: number; esFavorito: boolean }) =>
      toggleFavorito(id, esFavorito),
    onSuccess: (_, { esFavorito }) => {
      qc.invalidateQueries({ queryKey: ["licitaciones"] });
      qc.invalidateQueries({ queryKey: ["favoritos"] });
      toast.success(esFavorito ? "Eliminado de favoritos" : "Guardado en favoritos");
    },
    onError: () => toast.error("No se pudo actualizar el favorito"),
  });

  const limpiar = () => {
    setSearch(""); setEstado(""); setProvincia(""); setRubro("");
    setFechaPubDesde(""); setFechaPubHasta("");
    setFechaApDesde(""); setFechaApHasta("");
    setMontoMin(""); setMontoMax("");
    setOrdering("-fecha_publicacion"); setPage(1);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Licitaciones</h2>
          {data && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {data.count} resultado{data.count !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={ordering}
            onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
            className={selectCls}
          >
            {ORDEN_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={async () => {
              setExportando(true);
              try {
                await exportarCSV({ search: search || undefined, estado: estado || undefined, provincia: provincia || undefined, rubro: rubro || undefined, fecha_publicacion_desde: fechaPubDesde || undefined, fecha_publicacion_hasta: fechaPubHasta || undefined, fecha_apertura_desde: fechaApDesde || undefined, fecha_apertura_hasta: fechaApHasta || undefined, monto_min: montoMin || undefined, monto_max: montoMax || undefined, ordering });
              } finally {
                setExportando(false);
              }
            }}
            disabled={exportando}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <Download size={15} />
            {exportando ? "Exportando..." : "CSV"}
          </button>
          {isEditor && (
            <button
              onClick={() => navigate("/licitaciones/nueva")}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              + Nueva
            </button>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4 space-y-3">

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, organismo, expediente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`${inputCls} pl-9`}
          />
        </div>

        {/* Pills de estado + filtros básicos */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Estado como pills */}
          <div className="flex gap-1">
            {ESTADOS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setEstado(value); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  estado === value
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Provincia */}
          <select
            value={provincia}
            onChange={(e) => { setProvincia(e.target.value); setPage(1); }}
            className={selectCls}
          >
            <option value="">Todas las provincias</option>
            {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Rubro */}
          <input
            type="text"
            placeholder="Rubro..."
            value={rubro}
            onChange={(e) => { setRubro(e.target.value); setPage(1); }}
            className={`${inputCls} w-36`}
          />

          <div className="flex-1" />

          {/* Toggle filtros avanzados */}
          <button
            onClick={() => setAvanzado(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <SlidersHorizontal size={14} />
            Más filtros
            {avanzado ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {hayFiltros && (
            <button
              onClick={limpiar}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <X size={13} /> Limpiar
            </button>
          )}
        </div>

        {/* Filtros avanzados */}
        {avanzado && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha de publicación</p>
              <div className="flex items-center gap-2">
                <input type="date" value={fechaPubDesde} onChange={(e) => { setFechaPubDesde(e.target.value); setPage(1); }} className={inputCls} />
                <span className="text-gray-400 text-xs shrink-0">a</span>
                <input type="date" value={fechaPubHasta} onChange={(e) => { setFechaPubHasta(e.target.value); setPage(1); }} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha de apertura</p>
              <div className="flex items-center gap-2">
                <input type="date" value={fechaApDesde} onChange={(e) => { setFechaApDesde(e.target.value); setPage(1); }} className={inputCls} />
                <span className="text-gray-400 text-xs shrink-0">a</span>
                <input type="date" value={fechaApHasta} onChange={(e) => { setFechaApHasta(e.target.value); setPage(1); }} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Monto estimado ($)</p>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Mínimo" value={montoMin} onChange={(e) => { setMontoMin(e.target.value); setPage(1); }} className={inputCls} />
                <span className="text-gray-400 text-xs shrink-0">a</span>
                <input type="number" placeholder="Máximo" value={montoMax} onChange={(e) => { setMontoMax(e.target.value); setPage(1); }} className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? <Spinner /> : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Expediente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Título</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Organismo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Apertura</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Monto</th>
                {isEditor && <th className="w-16 px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data?.results.length === 0 && (
                <tr>
                  <td colSpan={isEditor ? 8 : 7} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    No hay licitaciones que coincidan con los filtros
                  </td>
                </tr>
              )}
              {data?.results.map((l) => (
                <tr
                  key={l.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => navigate(`/licitaciones/${l.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => favMutation.mutate({ id: l.id, esFavorito: l.es_favorito })}
                      className="text-gray-300 hover:text-yellow-400 transition-colors"
                    >
                      <Star size={16} className={l.es_favorito ? "fill-yellow-400 text-yellow-400" : ""} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{l.numero_expediente || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{l.titulo}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{l.rubro || l.provincia}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">{l.organismo}</td>
                  <td className="px-4 py-3"><Badge estado={l.estado} /></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {l.fecha_apertura ? format(new Date(l.fecha_apertura), "dd MMM yy", { locale: es }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {l.monto_estimado ? `$${Number(l.monto_estimado).toLocaleString("es-AR")}` : "—"}
                  </td>
                  {isEditor && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/licitaciones/${l.id}/editar`)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!data?.previous}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Página {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!data?.next}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
