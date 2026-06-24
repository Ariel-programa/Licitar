import { useQuery } from "@tanstack/react-query";
import { getResumen } from "@/services/estadisticas";
import Spinner from "@/components/Spinner";
import { ClipboardList, FolderOpen, FolderClosed, Trophy, TrendingUp, MapPin, FileText } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ["resumen"], queryFn: getResumen });

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
      icon: ClipboardList,
      gradient: "from-blue-400 to-blue-600",
      blob: "bg-blue-400",
      sub: "licitaciones",
    },
    {
      label: "Abiertas",
      value: abiertas,
      icon: FolderOpen,
      gradient: "from-emerald-400 to-teal-500",
      blob: "bg-emerald-400",
      sub: `${pctAbiertas}% del total`,
    },
    {
      label: "Cerradas",
      value: cerradas,
      icon: FolderClosed,
      gradient: "from-slate-400 to-slate-500",
      blob: "bg-slate-400",
      sub: "finalizadas",
    },
    {
      label: "Adjudicadas",
      value: adjudicadas,
      icon: Trophy,
      gradient: "from-violet-400 to-purple-600",
      blob: "bg-violet-400",
      sub: "con ganador",
    },
  ];

  const COLORES: Record<string, string> = {
    abierta: "#34d399",
    cerrada: "#94a3b8",
    adjudicada: "#a78bfa",
    suspendida: "#fbbf24",
    desconocido: "#cbd5e1",
  };

  const pieData =
    data?.por_estado.map((e) => ({
      name: e.estado.charAt(0).toUpperCase() + e.estado.slice(1),
      value: e.total,
      color: COLORES[e.estado] ?? "#cbd5e1",
    })) ?? [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl px-4 py-2">
          <p className="font-semibold text-white">{payload[0].name}</p>
          <p className="text-sm text-white/70">{payload[0].value} licitaciones</p>
        </div>
      );
    }
    return null;
  };

  const glassCls =
    "bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-2xl rounded-2xl";

  return (
    <div className="relative min-h-full overflow-hidden">

      {/* ── Fondo degradado ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-800 to-violet-900 dark:from-gray-950 dark:via-blue-950 dark:to-violet-950 -z-20" />

      {/* ── Blobs decorativos ── */}
      <div className="absolute -top-24 -left-24 w-[480px] h-[480px] bg-blue-500/40 dark:bg-blue-600/25 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] bg-violet-500/40 dark:bg-violet-700/25 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[360px] h-[360px] bg-emerald-500/25 dark:bg-emerald-700/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-2/3 left-1/2 w-[280px] h-[280px] bg-pink-500/20 dark:bg-pink-700/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* ── Contenido ── */}
      <div className="relative p-8 max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-blue-200/80 uppercase mb-1">
            Panel principal
          </p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Hola, <span className="text-blue-200">{user?.email?.split("@")[0]}</span> 👋
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Resumen de licitaciones públicas de salud en tiempo real
          </p>
        </div>

        {/* ── Tarjetas de métricas ── */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {metrics.map(({ label, value, icon: Icon, gradient, blob, sub }) => (
            <div key={label} className={`${glassCls} relative overflow-hidden p-5`}>
              {/* Blob de color detrás del ícono */}
              <div className={`absolute -top-8 -right-8 w-32 h-32 ${blob}/30 rounded-full blur-2xl pointer-events-none`} />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-white/75 tracking-wide">
                    {label}
                  </span>
                  <div className={`bg-gradient-to-br ${gradient} p-2 rounded-xl shadow-lg`}>
                    <Icon size={18} className="text-white" />
                  </div>
                </div>
                <p className="text-5xl font-black text-white tracking-tight">{value}</p>
                <p className="text-xs text-white/50 mt-2 font-medium">{sub}</p>
              </div>

              {/* Línea de acento inferior */}
              <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${gradient} opacity-60`} />
            </div>
          ))}
        </div>

        {/* ── Gráficos ── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Gráfico de torta */}
          <div className={`${glassCls} p-6`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-blue-200" />
              <h3 className="font-bold text-white tracking-tight">Distribución por estado</h3>
            </div>
            <p className="text-xs text-white/45 mb-4">
              Proporción de licitaciones según su estado actual
            </p>

            {total === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/30">
                <FileText size={36} className="mb-2" />
                <p className="text-sm">Sin datos aún</p>
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
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: e.color }}
                      />
                      <span className="text-xs text-white/70 font-medium">{e.name}</span>
                      <span className="text-xs text-white/40">({e.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Top provincias */}
          <div className={`${glassCls} p-6`}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-blue-200" />
              <h3 className="font-bold text-white tracking-tight">Top provincias</h3>
            </div>
            <p className="text-xs text-white/45 mb-4">
              Provincias con más licitaciones registradas
            </p>

            {!data?.por_provincia.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/30">
                <MapPin size={36} className="mb-2" />
                <p className="text-sm">Sin datos aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.por_provincia.slice(0, 7).map((p, i) => {
                  const maxVal = data.por_provincia[0]?.total ?? 1;
                  const pct = Math.round((p.total / maxVal) * 100);
                  const medalGradients = [
                    "from-yellow-400 to-orange-400",
                    "from-gray-300 to-gray-400",
                    "from-amber-500 to-yellow-600",
                  ];
                  const barColors = [
                    "bg-blue-300", "bg-blue-200", "bg-indigo-300",
                    "bg-indigo-200", "bg-sky-300", "bg-sky-200", "bg-violet-300",
                  ];
                  return (
                    <div key={p.provincia} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${medalGradients[i] ?? "from-white/20 to-white/10"} flex items-center justify-center shrink-0`}
                      >
                        <span className="text-xs font-black text-white drop-shadow">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white/85 truncate">
                            {p.provincia || "Sin especificar"}
                          </span>
                          <span className="text-sm font-bold text-white ml-2 shrink-0">{p.total}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className={`${barColors[i] ?? "bg-white/40"} h-1.5 rounded-full transition-all duration-700`}
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
      </div>
    </div>
  );
}
