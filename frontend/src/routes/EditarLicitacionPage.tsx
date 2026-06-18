import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Spinner from "@/components/Spinner";
import { toast } from "@/lib/toastStore";
import { useIsEditor } from "@/lib/authStore";

const PROVINCIAS = [
  "Nacional", "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut",
  "Cordoba", "Corrientes", "Entre Rios", "Formosa", "Jujuy", "La Pampa",
  "La Rioja", "Mendoza", "Misiones", "Neuquen", "Rio Negro", "Salta",
  "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucuman",
];

const schema = z.object({
  titulo: z.string().min(5, "Mínimo 5 caracteres"),
  organismo: z.string().min(3, "Requerido"),
  descripcion: z.string().optional(),
  estado: z.enum(["abierta", "cerrada", "adjudicada", "suspendida", "desconocido"]),
  provincia: z.string().optional(),
  rubro: z.string().optional(),
  numero_expediente: z.string().optional(),
  fecha_publicacion: z.string().optional(),
  fecha_apertura: z.string().optional(),
  monto_estimado: z.string().optional(),
  url_original: z.string().url("URL inválida").or(z.literal("")).optional(),
  url_pliego: z.string().url("URL inválida").or(z.literal("")).optional(),
});

type FormData = z.infer<typeof schema>;

const inputCls =
  "w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 dark:placeholder:text-gray-500";

const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

export default function EditarLicitacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEditor = useIsEditor();

  useEffect(() => {
    if (!isEditor) navigate("/licitaciones", { replace: true });
  }, [isEditor, navigate]);

  const { data: licitacion, isLoading } = useQuery({
    queryKey: ["licitacion", id],
    queryFn: async () => (await api.get(`/licitaciones/${id}/`)).data,
    enabled: !!id,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: licitacion,
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.patch(`/licitaciones/${id}/`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["licitaciones"] });
      qc.invalidateQueries({ queryKey: ["licitacion", id] });
      toast.success("Licitación actualizada");
      navigate("/licitaciones");
    },
    onError: () => toast.error("Error al guardar los cambios"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/licitaciones/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["licitaciones"] });
      toast.success("Licitación eliminada");
      navigate("/licitaciones");
    },
    onError: () => toast.error("Error al eliminar la licitación"),
  });

  if (!isEditor) return null;
  if (isLoading) return <Spinner />;

  const campo = (label: string, name: keyof FormData, type = "text") => (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} {...register(name)} className={inputCls} />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/licitaciones" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm">
          ← Volver
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Editar licitación</h2>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            {campo("Título *", "titulo")}
            {campo("Organismo *", "organismo")}
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea
              {...register("descripcion")}
              rows={3}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Estado</label>
              <select {...register("estado")} className={inputCls}>
                <option value="abierta">Abierta</option>
                <option value="cerrada">Cerrada</option>
                <option value="adjudicada">Adjudicada</option>
                <option value="suspendida">Suspendida</option>
                <option value="desconocido">Desconocido</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Provincia</label>
              <select {...register("provincia")} className={inputCls}>
                <option value="">Seleccionar...</option>
                {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {campo("Rubro", "rubro")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {campo("N° Expediente", "numero_expediente")}
            {campo("Monto estimado ($)", "monto_estimado", "number")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {campo("Fecha publicación", "fecha_publicacion", "date")}
            {campo("Fecha apertura", "fecha_apertura", "date")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {campo("URL original", "url_original")}
            {campo("URL pliego", "url_pliego")}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-primary-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
              <Link
                to="/licitaciones"
                className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </Link>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm("¿Eliminar esta licitación? Esta acción no se puede deshacer.")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar licitación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
