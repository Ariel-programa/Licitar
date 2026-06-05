import clsx from "clsx";

interface BadgeProps {
  estado: string;
  className?: string;
}

const colors: Record<string, string> = {
  abierta: "bg-green-100 text-green-800",
  cerrada: "bg-gray-100 text-gray-700",
  adjudicada: "bg-blue-100 text-blue-800",
  suspendida: "bg-yellow-100 text-yellow-800",
  desconocido: "bg-gray-100 text-gray-500",
};

export default function Badge({ estado, className }: BadgeProps) {
  return (
    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium capitalize", colors[estado] ?? colors.desconocido, className)}>
      {estado}
    </span>
  );
}
