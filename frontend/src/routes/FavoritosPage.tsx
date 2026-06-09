import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import { Star, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toggleFavorito } from "@/services/licitaciones";

export default function FavoritosPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: favoritos, isLoading } = useQuery({
    queryKey: ["favoritos"],
    queryFn: async () => (await api.get("/licitaciones/favoritos/")).data.results,
  });

  const favMutation = useMutation({
  mutationFn: (id: number) => toggleFavorito(id, true),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["favoritos"] });
    qc.invalidateQueries({ queryKey: ["licitaciones"] });
  },
});

  if (isLoading) return <Spinner />;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Star size={22} className="fill-yellow-400 text-yellow-400" />
        <h2 className="text-2xl font-bold text-gray-900">Mis favoritos</h2>
        <span className="text-sm text-gray-500">({favoritos?.length ?? 0})</span>
      </div>

      {favoritos?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No tenes licitaciones guardadas</p>
          <p className="text-sm text-gray-400 mt-1">Hace clic en la estrella de cualquier licitacion para agregarla</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favoritos?.map((f: any) => (
            <div
              key={f.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:border-primary-300 transition-colors"
              onClick={() => navigate(`/licitaciones/${f.licitacion.id}`)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{f.licitacion.titulo}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{f.licitacion.organismo}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge estado={f.licitacion.estado} />
                  {f.licitacion.fecha_apertura && (
                    <span className="text-xs text-gray-500">
                      Apertura: {format(new Date(f.licitacion.fecha_apertura), "dd MMM yy", { locale: es })}
                    </span>
                  )}
                  {f.licitacion.monto_estimado && (
                    <span className="text-sm font-medium text-gray-700">
                      ${Number(f.licitacion.monto_estimado).toLocaleString("es-AR")}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); favMutation.mutate(f.licitacion.id); }}
                className="ml-4 text-yellow-400 hover:text-gray-300 transition-colors"
              >
                <Star size={18} className="fill-yellow-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}