import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import { Star, Edit, ArrowLeft, ExternalLink, FileDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toggleFavorito } from "@/services/licitaciones";
import { useIsEditor } from "@/lib/authStore";
import { toast } from "@/lib/toastStore";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["licitacion", id] });
      qc.invalidateQueries({ queryKey: ["favoritos"] });
      toast.success(l?.es_favorito ? "Eliminado de favoritos" : "Guardado en favoritos");
    },
    onError: () => toast.error("No se pudo actualizar el favorito"),
  });

  if (isLoading) return <Spinner />;
  if (!l) return <div className="p-8 text-gray-500 dark:text-gray-400">Licitación no encontrada</div>;

  const campo = (label: string, valor: string | null | undefined) =>
    valor ? (
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-sm text-gray-900 dark:text-gray-100">{valor}</p>
      </div>
    ) : null;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">{l.titulo}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{l.organismo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <button
            onClick={() => favMutation.mutate()}
            disabled={favMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Star
              size={16}
              className={l.es_favorito ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}
            />
            {l.es_favorito ? "En favoritos" : "Guardar"}
          </button>
          {isEditor && (
            <Link
              to={`/licitaciones/${id}/editar`}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Edit size={16} />
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Badges de estado */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Badge estado={l.estado} />
        {l.provincia && (
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
            {l.provincia}
          </span>
        )}
        {l.rubro && (
          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
            {l.rubro}
          </span>
        )}
        {l.fuente_nombre && (
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-xs">
            {l.fuente_nombre}
          </span>
        )}
      </div>

      {/* Cards de info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Información general</h3>
          {campo("Nº Expediente", l.numero_expediente)}
          {campo("Organismo", l.organismo)}
          {campo("Fuente", l.fuente_nombre)}
          {campo("Rubro", l.rubro)}
          {campo("Provincia", l.provincia)}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Fechas y monto</h3>
          {l.fecha_publicacion && campo(
            "Fecha de publicación",
            format(new Date(l.fecha_publicacion), "dd 'de' MMMM 'de' yyyy", { locale: es })
          )}
          {l.fecha_apertura && campo(
            "Fecha de apertura",
            format(new Date(l.fecha_apertura), "dd 'de' MMMM 'de' yyyy", { locale: es })
          )}
          {l.monto_estimado && campo(
            "Monto estimado",
            `$${Number(l.monto_estimado).toLocaleString("es-AR")}`
          )}
          {campo("Publicado en LicitAR",
            format(new Date(l.created_at), "dd/MM/yyyy HH:mm", { locale: es })
          )}
        </div>
      </div>

      {/* Descripción */}
      {l.descripcion && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-3">Descripción</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{l.descripcion}</p>
        </div>
      )}

      {/* Enlaces */}
      {(l.url_original || l.url_pliego) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-3">Documentos y enlaces</h3>
          <div className="flex flex-wrap gap-3">
            {l.url_original && (
              <a
                href={l.url_original}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                <ExternalLink size={14} />
                Ver licitación original
              </a>
            )}
            {l.url_pliego && (
              <a
                href={l.url_pliego}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <FileDown size={14} />
                Descargar pliego
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
