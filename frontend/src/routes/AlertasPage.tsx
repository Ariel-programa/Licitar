import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import { Bell, FileText, Plus, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Alerta } from "@/types";
import { toast } from "@/lib/toastStore";

const PROVINCIAS = [
  "Nacional", "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut",
  "Cordoba", "Corrientes", "Entre Rios", "Formosa", "Jujuy", "La Pampa",
  "La Rioja", "Mendoza", "Misiones", "Neuquen", "Rio Negro", "Salta",
  "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucuman",
];

interface Notificacion {
  id: number;
  titulo: string;
  organismo: string;
  estado: string;
  created_at: string;
}

interface NotifsResponse {
  total: number;
  page: number;
  has_next: boolean;
  has_previous: boolean;
  items: Notificacion[];
}

interface AlertaForm {
  nombre: string;
  palabras_clave: string;
  provincia: string;
  rubro: string;
  canal: "email" | "telegram";
}

const inputCls =
  "w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 dark:placeholder:text-gray-500";

export default function AlertasPage() {
  const [tab, setTab] = useState<"notificaciones" | "alertas">("notificaciones");
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [nPage, setNPage] = useState(1);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: notifsData, isLoading: notifsLoading } = useQuery<NotifsResponse>({
    queryKey: ["notificaciones", nPage],
    queryFn: async () => (await api.get("/estadisticas/notificaciones/", { params: { page: nPage } })).data,
    enabled: tab === "notificaciones",
  });

  const { data: alertas, isLoading: alertasLoading } = useQuery<Alerta[]>({
    queryKey: ["alertas"],
    queryFn: async () => {
      const res = await api.get("/alertas/");
      return res.data.results ?? res.data;
    },
    enabled: tab === "alertas",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/alertas/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alertas"] });
      toast.success("Alerta eliminada");
    },
    onError: () => toast.error("No se pudo eliminar la alerta"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      api.patch(`/alertas/${id}/`, { activa }),
    onSuccess: (_, { activa }) => {
      qc.invalidateQueries({ queryKey: ["alertas"] });
      toast.success(activa ? "Alerta activada" : "Alerta pausada");
    },
    onError: () => toast.error("No se pudo actualizar la alerta"),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AlertaForm>({
    defaultValues: { canal: "email" },
  });

  const crearMutation = useMutation({
    mutationFn: (data: AlertaForm) => api.post("/alertas/", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alertas"] });
      reset();
      setCrearAbierto(false);
      toast.success("Alerta creada correctamente");
    },
    onError: () => toast.error("No se pudo crear la alerta"),
  });

  const tabCls = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      active
        ? "border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400"
        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    }`;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Alertas</h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
        <button className={tabCls(tab === "notificaciones")} onClick={() => setTab("notificaciones")}>
          Notificaciones recientes
          {notifsData && notifsData.total > 0 && (
            <span className="ml-2 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-xs px-1.5 py-0.5 rounded-full">
              {notifsData.total}
            </span>
          )}
        </button>
        <button className={tabCls(tab === "alertas")} onClick={() => setTab("alertas")}>
          Mis alertas configuradas
          {alertas && alertas.length > 0 && (
            <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded-full">
              {alertas.length}
            </span>
          )}
        </button>
      </div>

      {/* Panel: Notificaciones */}
      {tab === "notificaciones" && (
        notifsLoading ? <Spinner /> : (
          <div>
            {!notifsData?.items.length ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                <FileText size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">No hay licitaciones nuevas en los últimos 7 días</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {notifsData!.total} licitación{notifsData!.total !== 1 ? "es nuevas" : " nueva"} en los últimos 7 días
                </p>
                <div className="space-y-3 mb-4">
                  {notifsData!.items.map((n) => (
                    <div
                      key={n.id}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                      onClick={() => navigate(`/licitaciones/${n.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{n.titulo}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.organismo}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <Badge estado={n.estado} />
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {(notifsData!.has_next || notifsData!.has_previous) && (
                  <div className="flex items-center justify-between px-1">
                    <button
                      onClick={() => setNPage((p) => p - 1)}
                      disabled={!notifsData!.has_previous}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Página {nPage}</span>
                    <button
                      onClick={() => setNPage((p) => p + 1)}
                      disabled={!notifsData!.has_next}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )
      )}

      {/* Panel: Mis alertas */}
      {tab === "alertas" && (
        <div className="space-y-4">
          <button
            onClick={() => setCrearAbierto(v => !v)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Nueva alerta
            {crearAbierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {crearAbierto && (
            <form
              onSubmit={handleSubmit((data) => crearMutation.mutate(data))}
              className="bg-white dark:bg-gray-900 rounded-xl border border-primary-200 dark:border-primary-800 p-5 space-y-4"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Crear nueva alerta</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Nombre *
                  </label>
                  <input
                    {...register("nombre", { required: "Requerido" })}
                    placeholder="Ej: Medicamentos PAMI"
                    className={inputCls}
                  />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Canal</label>
                  <select {...register("canal")} className={inputCls}>
                    <option value="email">Email</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Palabras clave * <span className="text-gray-400 font-normal">(una por línea)</span>
                  </label>
                  <textarea
                    {...register("palabras_clave", { required: "Requerido" })}
                    rows={3}
                    placeholder={"medicamento\nreactivo\nequipo médico"}
                    className={inputCls}
                  />
                  {errors.palabras_clave && <p className="text-red-500 text-xs mt-1">{errors.palabras_clave.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Provincia</label>
                  <select {...register("provincia")} className={inputCls}>
                    <option value="">Todas</option>
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rubro</label>
                  <input
                    {...register("rubro")}
                    placeholder="Ej: Salud, Tecnología..."
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={crearMutation.isPending}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {crearMutation.isPending ? "Guardando..." : "Guardar alerta"}
                </button>
                <button
                  type="button"
                  onClick={() => { reset(); setCrearAbierto(false); }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {alertasLoading ? <Spinner /> : (
            alertas?.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                <Bell size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">No tenés alertas configuradas</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Creá una alerta para recibir notificaciones cuando aparezcan licitaciones con tus palabras clave
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertas?.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{a.nombre}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.activa
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}>
                          {a.activa ? "Activa" : "Pausada"}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                          {a.canal}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {a.palabras_clave.split("\n").filter(Boolean).map((p, i) => (
                          <span key={i} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            {p.trim()}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
                        {a.provincia && <span>Provincia: {a.provincia}</span>}
                        {a.rubro && <span>Rubro: {a.rubro}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleMutation.mutate({ id: a.id, activa: !a.activa })}
                        className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title={a.activa ? "Pausar" : "Activar"}
                      >
                        {a.activa
                          ? <ToggleRight size={22} className="text-primary-600 dark:text-primary-400" />
                          : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(a.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
