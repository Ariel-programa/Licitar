import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getLicitaciones, toggleFavorito } from "@/services/licitaciones";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import { Search, Star } from "lucide-react";
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

export default function LicitacionesPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [provincia, setProvincia] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEditor = useIsEditor();

  const { data, isLoading } = useQuery({
    queryKey: ["licitaciones", { search, estado, provincia, fechaDesde, fechaHasta, page }],
    queryFn: () => getLicitaciones({
      search,
      estado: estado || undefined,
      provincia: provincia || undefined,
      fecha_publicacion_desde: fechaDesde || undefined,
      fecha_publicacion_hasta: fechaHasta || undefined,
      page,
    }),
  });

  const favMutation = useMutation({
  mutationFn: ({ id, esFavorito }: { id: number; esFavorito: boolean }) =>
    toggleFavorito(id, esFavorito),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["licitaciones"] });
    qc.invalidateQueries({ queryKey: ["favoritos"] });
  },
});

  const limpiarFiltros = () => {
    setSearch(""); setEstado(""); setProvincia("");
    setFechaDesde(""); setFechaHasta(""); setPage(1);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Licitaciones</h2>
        <div className="flex items-center gap-3">
          {data && <p className="text-sm text-gray-500">{data.count} resultados</p>}
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

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por titulo, organismo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="cerrada">Cerrada</option>
            <option value="adjudicada">Adjudicada</option>
            <option value="suspendida">Suspendida</option>
          </select>
          <select
            value={provincia}
            onChange={(e) => { setProvincia(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas las provincias</option>
            {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-500">Publicacion:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-400">a</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {(search || estado || provincia || fechaDesde || fechaHasta) && (
            <button onClick={limpiarFiltros} className="text-sm text-red-500">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Expediente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Titulo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Organismo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Apertura</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Monto</th>
                {isEditor && <th className="w-16 px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.results.length === 0 && (
                <tr>
                  <td colSpan={isEditor ? 8 : 7} className="text-center py-12 text-gray-400">
                    No hay licitaciones que coincidan con los filtros
                  </td>
                </tr>
              )}
              {data?.results.map((l) => (
                <tr
                  key={l.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/licitaciones/${l.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => favMutation.mutate({ id: l.id, esFavorito: l.es_favorito })}
                      className="text-gray-300 hover:text-yellow-400 transition-colors"
                    >
                      <Star
                        size={16}
                        className={l.es_favorito ? "fill-yellow-400 text-yellow-400" : ""}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{l.numero_expediente || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 line-clamp-1">{l.titulo}</div>
                    <div className="text-xs text-gray-500">{l.provincia}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{l.organismo}</td>
                  <td className="px-4 py-3"><Badge estado={l.estado} /></td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {l.fecha_apertura ? format(new Date(l.fecha_apertura), "dd MMM yy", { locale: es }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {l.monto_estimado ? `$${Number(l.monto_estimado).toLocaleString("es-AR")}` : "—"}
                  </td>
                  {isEditor && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/licitaciones/${l.id}/editar`)}
                        className="text-xs text-gray-400"
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!data?.previous}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">Pagina {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!data?.next}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}