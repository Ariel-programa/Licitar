import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

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
  url_original: z.string().optional(),
  url_pliego: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NuevaLicitacionPage() {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { estado: "abierta" },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: FormData) => api.post("/licitaciones/", data),
    onSuccess: () => navigate("/licitaciones"),
  });

  const campo = (label: string, name: keyof FormData, type = "text", required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
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
        <h2 className="text-2xl font-bold text-gray-900">Nueva licitación</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            {campo("Título", "titulo", "text", true)}
            {campo("Organismo", "organismo", "text", true)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado <span className="text-red-500">*</span></label>
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

          {error && <p className="text-red-500 text-sm">Error al guardar la licitación</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-primary-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Guardando..." : "Guardar licitación"}
            </button>
            <Link
              to="/licitaciones"
              className="border border-gray-300 text-gray-700 rounded-lg px-6 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}