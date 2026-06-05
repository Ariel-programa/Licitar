import { useQuery } from "@tanstack/react-query";
import { getResumen } from "@/services/estadisticas";
import Spinner from "@/components/Spinner";
import { FileText, CheckCircle, XCircle, Award } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["resumen"], queryFn: getResumen });

  if (isLoading) return <Spinner />;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: data?.total, icon: FileText, color: "text-blue-600" },
          { label: "Abiertas", value: data?.abiertas, icon: CheckCircle, color: "text-green-600" },
          { label: "Cerradas", value: data?.cerradas, icon: XCircle, color: "text-gray-600" },
          { label: "Adjudicadas", value: data?.adjudicadas, icon: Award, color: "text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon size={20} className={color} />
              <span className="text-sm text-gray-600">{label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Top provincias</h3>
        <div className="space-y-2">
          {data?.por_provincia.map((p) => (
            <div key={p.provincia} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{p.provincia || "Sin especificar"}</span>
              <span className="font-medium text-gray-900">{p.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
