import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLicitacion } from "@/services/licitaciones";

export default function LicitacionDetallePage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["licitacion", id],
    queryFn: () => getLicitacion(Number(id!)),
    enabled: !!id,
  });

  if (isLoading) return <p className="p-8">Cargando...</p>;

  if (!data) return <p className="p-8">No encontrada</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{data.titulo}</h1>

      <p className="text-gray-600 mt-2">{data.organismo}</p>

      <div className="mt-6">
        <p><b>Estado:</b> {data.estado}</p>
        <p><b>Provincia:</b> {data.provincia}</p>
        <p><b>Expediente:</b> {data.numero_expediente}</p>
      </div>

      <div className="mt-6">
        <p>{data.descripcion || "Sin descripción"}</p>
      </div>
    </div>
  );
}