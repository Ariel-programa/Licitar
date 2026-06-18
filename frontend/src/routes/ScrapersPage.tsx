import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFuentes, getJobs, ejecutarScraper, toggleFuente, getSchedule, updateSchedule } from "@/services/scrapers";
import Spinner from "@/components/Spinner";
import { Play, RefreshCw, CheckCircle, XCircle, Clock, Timer, ToggleLeft, ToggleRight, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/lib/toastStore";

const estadoConfig: Record<string, { color: string; icon: any }> = {
  completado: { color: "text-green-400", icon: CheckCircle },
  fallido: { color: "text-red-400", icon: XCircle },
  corriendo: { color: "text-yellow-400", icon: RefreshCw },
  pendiente: { color: "text-slate-400", icon: Clock },
};

const INTERVALOS = [
  { label: "Cada 4 horas", value: 4 },
  { label: "Cada 6 horas", value: 6 },
  { label: "Cada 12 horas", value: 12 },
  { label: "Cada 24 horas", value: 24 },
];

export default function ScrapersPage() {
  const qc = useQueryClient();
  const [intervaloEdit, setIntervaloEdit] = useState<number | null>(null);

  const { data: schedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ["scraping-schedule"],
    queryFn: getSchedule,
  });

  const scheduleMutation = useMutation({
    mutationFn: updateSchedule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scraping-schedule"] });
      toast.success("Configuración guardada");
      setIntervaloEdit(null);
    },
    onError: () => toast.error("No se pudo actualizar el schedule"),
  });

  const { data: fuentes, isLoading: loadingFuentes } = useQuery({
    queryKey: ["scrapers-fuentes"],
    queryFn: getFuentes,
    refetchInterval: 10000,
  });

  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["scrapers-jobs"],
    queryFn: getJobs,
    refetchInterval: 5000,
  });

  const ejecutarMutation = useMutation({
    mutationFn: (id: number) => ejecutarScraper(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrapers-jobs"] });
      qc.invalidateQueries({ queryKey: ["scrapers-fuentes"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      toggleFuente(id, activa),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scrapers-fuentes"] }),
  });

  if (loadingFuentes) return <Spinner />;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Panel de Scrapers</h2>
        <p className="text-slate-400 text-sm mt-1">
          Monitoreá y ejecuta los scrapers de licitaciones de insumos medicos
        </p>
      </div>

      {/* Schedule automático */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Timer size={18} className="text-cyan-400" />
          <h3 className="font-semibold text-white">Scraping automático</h3>
        </div>

        {loadingSchedule ? (
          <Spinner />
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            {/* Toggle habilitado */}
            <button
              onClick={() => scheduleMutation.mutate({ habilitado: !schedule?.habilitado })}
              disabled={scheduleMutation.isPending}
              className="flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {schedule?.habilitado ? (
                <ToggleRight size={28} className="text-cyan-400" />
              ) : (
                <ToggleLeft size={28} className="text-slate-500" />
              )}
              <span className={schedule?.habilitado ? "text-cyan-400" : "text-slate-500"}>
                {schedule?.habilitado ? "Habilitado" : "Deshabilitado"}
              </span>
            </button>

            <div className="h-8 w-px bg-slate-700" />

            {/* Selector de intervalo */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Frecuencia:</span>
              <select
                value={intervaloEdit ?? schedule?.intervalo_horas ?? 6}
                onChange={(e) => setIntervaloEdit(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {INTERVALOS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {intervaloEdit !== null && intervaloEdit !== schedule?.intervalo_horas && (
                <button
                  onClick={() => scheduleMutation.mutate({ intervalo_horas: intervaloEdit })}
                  disabled={scheduleMutation.isPending}
                  className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Zap size={12} />
                  Guardar
                </button>
              )}
            </div>

            <div className="h-8 w-px bg-slate-700" />

            {/* Último run */}
            <div className="text-sm text-slate-400">
              Última ejecución:{" "}
              <span className="text-slate-300">
                {schedule?.ultimo_run
                  ? formatDistanceToNow(new Date(schedule.ultimo_run), { addSuffix: true, locale: es })
                  : "Nunca"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Fuentes */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {fuentes?.map((f: any) => (
          <div
            key={f.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{f.nombre}</h3>
                <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{f.url_base}</p>
              </div>
              <button
                onClick={() => toggleMutation.mutate({ id: f.id, activa: !f.activa })}
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  f.activa
                    ? "bg-green-500/20 text-green-400"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {f.activa ? "Activa" : "Inactiva"}
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              {f.ultimo_scraping
                ? `Ultimo scraping: ${formatDistanceToNow(new Date(f.ultimo_scraping), { addSuffix: true, locale: es })}`
                : "Sin scraping previo"}
            </p>

            <button
              onClick={() => ejecutarMutation.mutate(f.id)}
              disabled={!f.activa || ejecutarMutation.isPending}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors w-full justify-center"
            >
              <Play size={14} />
              Ejecutar ahora
            </button>
          </div>
        ))}
      </div>

      {/* Historial de jobs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">Historial de ejecuciones</h3>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["scrapers-jobs"] })}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {loadingJobs ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Fuente</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Nuevas</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Duplicados</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Duracion</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Hace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {jobs?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Sin ejecuciones aun
                  </td>
                </tr>
              )}
              {jobs?.map((j: any) => {
                const cfg = estadoConfig[j.estado] ?? estadoConfig.pendiente;
                const Icon = cfg.icon;
                return (
                  <tr key={j.id} className="hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-3 text-slate-300">{j.fuente_nombre}</td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 ${cfg.color}`}>
                        <Icon size={14} className={j.estado === "corriendo" ? "animate-spin" : ""} />
                        <span className="capitalize text-xs">{j.estado}</span>
                      </div>
                      {j.error_mensaje && (
                        <p className="text-xs text-red-400 mt-1 truncate max-w-xs">{j.error_mensaje}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-green-400 font-medium">{j.total_nuevos ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{j.total_duplicados ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {j.duracion ? `${j.duracion}s` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDistanceToNow(new Date(j.created_at), { addSuffix: true, locale: es })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}