import { useQuery } from "@tanstack/react-query";
import { getAvanzadas } from "@/services/estadisticas";
import Spinner from "@/components/Spinner";
import { DollarSign, TrendingUp, BarChart2, Tag } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const RUBROS_COLORS = [
  "#60a5fa", "#34d399", "#a78bfa", "#fbbf24", "#f87171",
  "#38bdf8", "#4ade80", "#c084fc", "#facc15", "#fb923c",
];

const formatMonto = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${(n / 1_000).toFixed(0)}K`;

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-300 font-medium">{label}</p>
      <p className="text-blue-400 font-bold">{payload[0].value} licitaciones</p>
    </div>
  );
};

const CustomRubroTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-300 font-medium">{label}</p>
      <p className="text-emerald-400 font-bold">{payload[0].value} licitaciones</p>
    </div>
  );
};

export default function EstadisticasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["estadisticas-avanzadas"],
    queryFn: getAvanzadas,
  });

  if (isLoading) return <Spinner />;

  const mesDatos = (data?.por_mes ?? []).map((item) => ({
    ...item,
    label: format(parseISO(item.mes + "-01"), "MMM yy", { locale: es }),
  }));

  const rubroDatos = (data?.top_rubros ?? []).map((item) => ({
    ...item,
    label: item.rubro.length > 22 ? item.rubro.slice(0, 22) + "…" : item.rubro,
  }));

  const cards = [
    {
      label: "Monto total estimado",
      value: formatMonto(data?.monto_total ?? 0),
      sub: "en licitaciones con monto",
      icon: DollarSign,
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      label: "Monto promedio",
      value: formatMonto(data?.monto_promedio ?? 0),
      sub: "por licitación",
      icon: TrendingUp,
      gradient: "from-blue-400 to-blue-600",
    },
    {
      label: "Meses con datos",
      value: mesDatos.length,
      sub: "últimos 12 meses",
      icon: BarChart2,
      gradient: "from-violet-400 to-purple-600",
    },
    {
      label: "Rubros distintos",
      value: rubroDatos.length,
      sub: "en top 10",
      icon: Tag,
      gradient: "from-amber-400 to-orange-500",
    },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Estadísticas</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Análisis de licitaciones de los últimos 12 meses
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, sub, icon: Icon, gradient }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
              <div className={`bg-gradient-to-br ${gradient} p-2 rounded-xl`}>
                <Icon size={16} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
            <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${gradient} opacity-50`} />
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">

        {/* Licitaciones por mes */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Licitaciones por mes</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Últimos 12 meses según fecha de publicación</p>

          {mesDatos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300 dark:text-gray-600">
              <BarChart2 size={36} className="mb-2" />
              <p className="text-sm">Sin datos de publicación por fecha</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={mesDatos} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top rubros */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Top rubros</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">10 rubros con más licitaciones registradas</p>

          {rubroDatos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300 dark:text-gray-600">
              <Tag size={36} className="mb-2" />
              <p className="text-sm">Sin datos de rubro</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rubroDatos} layout="vertical" barSize={14} margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} className="dark:stroke-gray-800" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomRubroTooltip />} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {rubroDatos.map((_, i) => (
                    <Cell key={i} fill={RUBROS_COLORS[i % RUBROS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
