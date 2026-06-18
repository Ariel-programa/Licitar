import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import { Star, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toggleFavorito } from "@/services/licitaciones";
import { toast } from "@/lib/toastStore";

const PAGE_SIZE = 10;

export default function FavoritosPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["favoritos", page],
    queryFn: async () => (await api.get("/licitaciones/favoritos/", { params: { page } })).data,
  });

  const favoritos = data?.results ?? [];

  const favMutation = useMutation({
    mutationFn: (id: number) => toggleFavorito(id, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favoritos"] });
      qc.invalidateQueries({ queryKey: ["licitaciones"] });
      toast.success("Eliminado de favoritos");
    },
    onError: () => toast.error("No se pudo eliminar el favorito"),
  });

  if (isLoading) return <Spinner />;

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Star size={22} className="fill-yellow-400 text-yellow-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mis favoritos</h2>
        {data && (
          <span className="text-sm text-gray-500 dark:text-gray-400">({data.count})</span>
        )}
      </div>

      {favoritos.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">No tenés licitaciones guardadas</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Hacé clic en la estrella de cualquier licitación para agregarla
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {favoritos.map((f: any) => (
              <div
                key={f.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                onClick={() => navigate(`/licitaciones/${f.licitacion.id}`)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{f.licitacion.titulo}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{f.licitacion.organismo}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge estado={f.licitacion.estado} />
                    {f.licitacion.fecha_apertura && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Apertura: {format(new Date(f.licitacion.fecha_apertura), "dd MMM yy", { locale: es })}
                      </span>
                    )}
                    {f.licitacion.monto_estimado && (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        ${Number(f.licitacion.monto_estimado).toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); favMutation.mutate(f.licitacion.id); }}
                  className="ml-4 text-yellow-400 hover:text-gray-300 dark:hover:text-gray-600 transition-colors"
                  title="Quitar de favoritos"
                >
                  <Star size={18} className="fill-yellow-400" />
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data?.previous}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data?.next}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
