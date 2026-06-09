import { useQuery } from "@tanstack/react-query";
import { getResumen } from "@/services/estadisticas";
import Spinner from "@/components/Spinner";
import { FileText, CheckCircle, XCircle, Award, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ["resumen"], queryFn: getResumen });

  if (isLoading) return <Spinner />;

  const total = data?.total ?? 0;
  const abiertas = data?.abiertas ?? 0;
  const cerradas = data?.cerradas ?? 0;
  const adjudicadas = data?.adjudicadas ?? 0;

  const pctAbiertas = total > 0 ? Math.round((abiertas / total) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Bienvenido{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h2>
        <p className="text-gray-500 text-sm mt-1">Resumen de licitaciones publicas de salud</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Abiertas", value: abiertas, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Cerradas", value: cerradas, icon: XCircle, color: "text-gray-600", bg: "bg-gray-50" },
          { label: "Adjudicadas", value: adjudicadas, icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {label === "Abiertas" && total > 0 && (
              <p className="text-xs text-green-600 mt-1">{pctAbiertas}% del total</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Por estado - barra visual */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" />
            Distribucion por estado
          </h3>
          {total === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos aun</p>
          ) : (
            <div className="space-y-3">
              {data?.por_estado.map((e) => {
                const pct = Math.round((e.total / total) * 100);
                const colores: Record<string, string> = {
                  abierta: "bg-green-500",
                  cerrada: "bg-gray-400",
                  adjudicada: "bg-blue-500",
                  suspendida: "bg-yellow-500",
                  desconocido: "bg-gray-300",
                };
                return (
                  <div key={e.estado}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700">{e.estado}</span>
                      <span className="text-gray-500">{e.total} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${colores[e.estado] ?? "bg-gray-300"} h-2 rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top provincias */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top provincias</h3>
          {data?.por_provincia.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos aun</p>
          ) : (
            <div className="space-y-3">
              {data?.por_provincia.slice(0, 8).map((p, i) => {
                const maxVal = data.por_provincia[0]?.total ?? 1;
                const pct = Math.round((p.total / maxVal) * 100);
                return (
                  <div key={p.provincia} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{p.provincia || "Sin especificar"}</span>
                        <span className="text-gray-500 font-medium">{p.total}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all"
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
  );
}