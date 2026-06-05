import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLicitaciones } from "@/services/licitaciones";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import { Search, Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function LicitacionesPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["licitaciones", { search, estado, page }],
    queryFn: () => getLicitaciones({ search, estado: estado || undefined, page }),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Licitaciones</h2>
        {data && <p className="text-sm text-gray-500">{data.count} resultados</p>}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, organismo..."
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
      </div>

      {isLoading ? <Spinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Expediente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Organismo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Apertura</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.results.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{l.numero_expediente || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 line-clamp-1">{l.titulo}</div>
                    <div className="text-xs text-gray-500">{l.provincia}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{l.organismo}</td>
                  <td className="px-4 py-3"><Badge estado={l.estado} /></td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {l.fecha_apertura ? format(new Date(l.fecha_apertura), "dd MMM yy", { locale: es }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {l.monto_estimado ? `$${Number(l.monto_estimado).toLocaleString("es-AR")}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!data?.previous}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">Página {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!data?.next}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
