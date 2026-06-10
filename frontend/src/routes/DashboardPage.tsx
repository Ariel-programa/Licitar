import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getResumen } from "@/services/estadisticas";
import { getFuentes, triggerFuente, triggerAll, type FuenteScraping } from "@/services/scrapers";
import Spinner from "@/components/Spinner";
import { FileText, CheckCircle, XCircle, Award, TrendingUp, MapPin, RefreshCw, Play, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["resumen"], queryFn: getResumen });
  const { data: fuentes = [], isLoading: fuentesLoading } = useQuery({
    queryKey: ["fuentes-scraping"],
    queryFn: getFuentes,
    refetchInterval: 10000,
  });

  const [triggeringAll, setTriggeringAll] = useState(false);
  const [triggeredIds, setTriggeredIds] = useState<Set<number>>(new Set());

  const triggerMut = useMutation({
    mutationFn: (id: number) => triggerFuente(id),
    onMutate: (id) => setTriggeredIds((s) => new Set(s).add(id)),
    onSettled: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["fuentes-scraping"] });
        setTriggeredIds(new Set());
      }, 3000);
    },
  });

  const handleTriggerAll = async () => {
    setTriggeringAll(true);
    try {
      await triggerAll();
    } finally {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["fuentes-scraping"] });
        setTriggeringAll(false);
      }, 3000);
    }
  };

  if (isLoading) return <Spinner />;

  const total = data?.total ?? 0;
  const abiertas = data?.abiertas ?? 0;
  const cerradas = data?.cerradas ?? 0;
  const adjudicadas = data?.adjudicadas ?? 0;
  const pctAbiertas = total > 0 ? Math.round((abiertas / total) * 100) : 0;

  const metrics = [
    {
      label: "Total",
      value: total,
      icon: FileText,
      gradient: "from-blue-500 to-blue-700",
      sub: "licitaciones",
    },
    {
      label: "Abiertas",
      value: abiertas,
      icon: CheckCircle,
      gradient: "from-emerald-400 to-teal-600",
      sub: `${pctAbiertas}% del total`,
    },
    {
      label: "Cerradas",
      value: cerradas,
      icon: XCircle,
      gradient: "from-slate-400 to-slate-600",
      sub: "finalizadas",
    },
    {
      label: "Adjudicadas",
      value: adjudicadas,
      icon: Award,
      gradient: "from-violet-500 to-purple-700",
      sub: "con ganador",
    },
  ];

  const COLORES: Record<string, string> = {
    abierta: "#10b981",
    cerrada: "#94a3b8",
    adjudicada: "#8b5cf6",
    suspendida: "#f59e0b",
    desconocido: "#e2e8f0",
  };

  const pieData = data?.por_estado.map((e) => ({
    name: e.estado.charAt(0).toUpperCase() + e.estado.slice(1),
    value: e.total,
    color: COLORES[e.estado] ?? "#e2e8f0",
  })) ?? [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-2">
          <p className="font-semibold text-gray-800">{payload[0].name}</p>
          <p className="text-sm text-gray-500">{payload[0].value} licitaciones</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-1">Panel principal</p>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Hola, <span className="text-blue-600">{user?.email?.split("@")[0]}</span> 👋
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Resumen de licitaciones publicas de salud en tiempo real
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map(({ label, value, icon: Icon, gradient, sub }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-md`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold opacity-90 tracking-wide">{label}</span>
              <div className="bg-white bg-opacity-20 p-2 rounded-xl">
                <Icon size={18} className="text-white" />
              </div>
            </div>
            <p className="text-5xl font-black tracking-tight">{value}</p>
            <p className="text-xs opacity-70 mt-2 font-medium">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Grafico de torta */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-500" />
            <h3 className="font-bold text-gray-800 tracking-tight">Distribucion por estado</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Proporcion de licitaciones segun su estado actual</p>

          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <FileText size={36} className="mb-2" />
              <p className="text-sm">Sin datos aun</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {pieData.map((e) => (
                  <div key={e.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="text-xs text-gray-600 font-medium">{e.name}</span>
                    <span className="text-xs text-gray-400">({e.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top provincias */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-blue-500" />
            <h3 className="font-bold text-gray-800 tracking-tight">Top provincias</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Provincias con mas licitaciones registradas</p>

          {!data?.por_provincia.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <MapPin size={36} className="mb-2" />
              <p className="text-sm">Sin datos aun</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.por_provincia.slice(0, 7).map((p, i) => {
                const maxVal = data.por_provincia[0]?.total ?? 1;
                const pct = Math.round((p.total / maxVal) * 100);
                const gradients = [
                  "from-yellow-400 to-orange-400",
                  "from-gray-300 to-gray-400",
                  "from-amber-500 to-yellow-600",
                ];
                const barColors = [
                  "bg-blue-500", "bg-blue-400", "bg-blue-300",
                  "bg-indigo-400", "bg-indigo-300", "bg-sky-400", "bg-sky-300",
                ];
                return (
                  <div key={p.provincia} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradients[i] ?? "from-gray-200 to-gray-300"} flex items-center justify-center`}>
                      <span className="text-xs font-black text-white">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-700">
                          {p.provincia || "Sin especificar"}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{p.total}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${barColors[i] ?? "bg-blue-300"} h-2 rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel de Scraping */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-blue-500" />
            <h3 className="font-bold text-gray-800 tracking-tight">Fuentes de scraping</h3>
          </div>
          <button
            onClick={handleTriggerAll}
            disabled={triggeringAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <Play size={14} />
            {triggeringAll ? "Iniciando..." : "Ejecutar todas"}
          </button>
        </div>

        {fuentesLoading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : fuentes.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-gray-300 gap-2">
            <AlertCircle size={32} />
            <p className="text-sm">No hay fuentes configuradas. Ejecuta <code className="bg-gray-100 text-gray-600 px-1 rounded">python manage.py setup_fuentes</code></p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {fuentes.map((f: FuenteScraping) => {
              const job = f.ultimo_job;
              const isRunning = job?.estado === "corriendo";
              const isFailed = job?.estado === "fallido";
              const isTriggering = triggeredIds.has(f.id);

              return (
                <div key={f.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm truncate">{f.nombre}</span>
                      {!f.activa && (
                        <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">inactiva</span>
                      )}
                      {isFailed && (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">fallido</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{f.url_base}</p>
                    {job && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isRunning ? (
                          <span className="text-blue-500 font-medium">Ejecutando...</span>
                        ) : (
                          <>
                            {job.total_nuevos} nuevas
                            {job.finalizado_en && (
                              <> · {new Date(job.finalizado_en).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</>
                            )}
                            {isFailed && job.error_mensaje && (
                              <span className="text-red-400"> · {job.error_mensaje.slice(0, 60)}</span>
                            )}
                          </>
                        )}
                      </p>
                    )}
                    {!job && (
                      <p className="text-xs text-gray-300 mt-0.5">Nunca ejecutada</p>
                    )}
                  </div>

                  <button
                    onClick={() => triggerMut.mutate(f.id)}
                    disabled={!f.activa || isRunning || isTriggering}
                    title="Ejecutar scraping"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw size={12} className={(isRunning || isTriggering) ? "animate-spin" : ""} />
                    {isTriggering ? "Iniciando..." : "Ejecutar"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}