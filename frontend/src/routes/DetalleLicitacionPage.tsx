import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import { Star, Edit, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toggleFavorito } from "@/services/licitaciones";
import { useIsEditor } from "@/lib/authStore";

export default function DetalleLicitacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEditor = useIsEditor();

  const { data: l, isLoading } = useQuery({
    queryKey: ["licitacion", id],
    queryFn: async () => (await api.get(`/licitaciones/${id}/`)).data,
  });

  const favMutation = useMutation({
    mutationFn: () => toggleFavorito(Number(id), l?.es_favorito),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licitacion", id] }),
  });

  if (isLoading) return <Spinner />;
  if (!l) return <div className="p-8 text-gray-500">Licitacion no encontrada</div>;

  const campo = (label: string, valor: string | null | undefined) =>
    valor ? (
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-900">{valor}</p>
      </div>
    ) : null;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{l.titulo}</h2>
            <p className="text-sm text-gray-500 mt-1">{l.organismo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => favMutation.mutate()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <Star
              size={16}
              className={l.es_favorito ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}
            />
            {l.es_favorito ? "En favoritos" : "Agregar a favoritos"}
          </button>
          {isEditor && (
            <Link
              to={`/licitaciones/${id}/editar`}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <Edit size={16} className="text-gray-400" />
              Editar
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Badge estado={l.estado} />
        {l.provincia && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{l.provincia}</span>
        )}
        {l.rubro && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{l.rubro}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">Informacion general</h3>
          {campo("N Expediente", l.numero_expediente)}
          {campo("Organismo", l.organismo)}
          {campo("Fuente", l.fuente_nombre)}
          {campo("Rubro", l.rubro)}
          {campo("Provincia", l.provincia)}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">Fechas y monto</h3>
          {l.fecha_publicacion && campo(
            "Fecha publicacion",
            format(new Date(l.fecha_publicacion), "dd 'de' MMMM 'de' yyyy", { locale: es })
          )}
          {l.fecha_apertura && campo(
            "Fecha apertura",
            format(new Date(l.fecha_apertura), "dd 'de' MMMM 'de' yyyy", { locale: es })
          )}
          {l.monto_estimado && campo(
            "Monto estimado",
            `$${Number(l.monto_estimado).toLocaleString("es-AR")}`
          )}
        </div>
      </div>

      {l.descripcion && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Descripcion</h3>
          <p className="text-sm text-gray-700">{l.descripcion}</p>
        </div>
      )}

      {(l.url_original || l.url_pliego) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Enlaces</h3>
          <div className="flex gap-4">
            {l.url_original && (
              <a href={l.url_original} target="_blank" rel="noreferrer" className="text-sm text-blue-600">
                Ver licitacion original
              </a>
            )}
            {l.url_pliego && (
              <a href={l.url_pliego} target="_blank" rel="noreferrer" className="text-sm text-blue-600">
                Descargar pliego
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}