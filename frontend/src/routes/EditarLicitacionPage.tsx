import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Spinner from "@/components/Spinner";

const schema = z.object({
  titulo: z.string().min(5),
  organismo: z.string().min(3),
  descripcion: z.string().optional(),
  estado: z.enum(["abierta", "cerrada", "adjudicada", "suspendida", "desconocido"]),
  provincia: z.string().optional(),
  rubro: z.string().optional(),
  numero_expediente: z.string().optional(),
  fecha_publicacion: z.string().optional(),
  fecha_apertura: z.string().optional(),
  monto_estimado: z.string().optional(),
  url_original: z.string().optional(),
  url_pliego: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditarLicitacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: licitacion, isLoading } = useQuery({
    queryKey: ["licitacion", id],
    queryFn: async () => (await api.get(`/licitaciones/${id}/`)).data,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: licitacion,
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.patch(`/licitaciones/${id}/`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["licitaciones"] });
      navigate("/licitaciones");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/licitaciones/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["licitaciones"] });
      navigate("/licitaciones");
    },
  });

  if (isLoading) return <Spinner />;

  const campo = (label: string, name: keyof FormData, type = "text") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        {...register(name)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/licitaciones" className="text-gray-500 hover:text-gray-700 text-sm">← Volver</Link>
        <h2 className="text-2xl font-bold text-gray-900">Editar licitación</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {campo("Título *", "titulo")}
            {campo("Organismo *", "organismo")}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              {...register("descripcion")}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                {...register("estado")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="abierta">Abierta</option>
                <option value="cerrada">Cerrada</option>
                <option value="adjudicada">Adjudicada</option>
                <option value="suspendida">Suspendida</option>
                <option value="desconocido">Desconocido</option>
              </select>
            </div>
            {campo("Provincia", "provincia")}
            {campo("Rubro", "rubro")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {campo("N° Expediente", "numero_expediente")}
            {campo("Monto estimado ($)", "monto_estimado")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {campo("Fecha publicación", "fecha_publicacion", "date")}
            {campo("Fecha apertura", "fecha_apertura", "date")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {campo("URL original", "url_original")}
            {campo("URL pliego", "url_pliego")}
          </div>

          <div className="flex items-center justify-between pt-2">
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
                className="border border-gray-300 text-gray-700 rounded-lg px-6 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm("¿Eliminar esta licitación?")) deleteMutation.mutate();
              }}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Eliminar licitación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}