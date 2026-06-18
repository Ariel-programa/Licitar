import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Notificaciones() {
  const [abierto, setAbierto] = useState(false);
  const [vistas, setVistas] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["notificaciones"],
    queryFn: async () => (await api.get("/estadisticas/notificaciones/")).data,
    refetchInterval: 1000 * 60 * 5,
  });

  const handleAbrir = () => {
    if (!abierto && data?.items) {
      setVistas(data.items.map((i: any) => i.id));
    }
    setAbierto(!abierto);
  };

  const limpiar = () => {
    if (data?.items) setVistas(data.items.map((i: any) => i.id));
    setAbierto(false);
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const total = data?.total ?? 0;
  const sinVer = data?.items?.filter((i: any) => !vistas.includes(i.id)).length ?? total;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleAbrir}
        className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {sinVer > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {sinVer > 9 ? "9+" : sinVer}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-50">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
              Licitaciones nuevas
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">últimos 7 días</span>
            </h3>
            {total > 0 && (
              <button
                onClick={limpiar}
                className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "320px" }}>
            {!data?.items?.length ? (
              <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                No hay licitaciones nuevas
              </div>
            ) : (
              data.items.map((item: any) => {
                const esVista = vistas.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setVistas((prev) => [...new Set([...prev, item.id])]);
                      navigate(`/licitaciones/${item.id}`);
                      setAbierto(false);
                    }}
                    className={`w-full text-left p-3 border-b border-gray-50 dark:border-gray-800 transition-colors ${
                      esVista
                        ? "hover:bg-gray-50 dark:hover:bg-gray-800"
                        : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!esVista && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{item.titulo}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.organismo}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {total > 0 && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { navigate("/alertas"); setAbierto(false); }}
                className="w-full text-center text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Ver todas las notificaciones →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
