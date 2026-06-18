import { useToastStore } from "@/lib/toastStore";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const icons = {
  success: <CheckCircle2 size={16} className="text-green-500 shrink-0" />,
  error: <XCircle size={16} className="text-red-500 shrink-0" />,
  info: <Info size={16} className="text-blue-500 shrink-0" />,
};

export default function Toaster() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-lg pointer-events-auto min-w-[280px] max-w-sm"
        >
          {icons[t.type]}
          <p className="text-sm text-gray-800 dark:text-gray-200 flex-1">{t.message}</p>
          <button
            onClick={() => remove(t.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
