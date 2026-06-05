import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Bell, Plus, Trash2 } from "lucide-react";
import type { Alerta } from "@/types";
import Spinner from "@/components/Spinner";

export default function AlertasPage() {
  const qc = useQueryClient();

  const { data: alertas, isLoading } = useQuery<Alerta[]>({
    queryKey: ["alertas"],
    queryFn: async () => (await api.get("/alertas/")).data.results ?? (await api.get("/alertas/")).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/alertas/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alertas"] }),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Alertas</h2>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors">
          <Plus size={16} /> Nueva alerta
        </button>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="space-y-3">
          {alertas?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p>No tenés alertas configuradas</p>
            </div>
          )}
          {alertas?.map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{a.nombre}</p>
                <p className="text-sm text-gray-500">Canal: {a.canal} · {a.activa ? "Activa" : "Inactiva"}</p>
                <p className="text-xs text-gray-400 mt-1">{a.palabras_clave}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(a.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
