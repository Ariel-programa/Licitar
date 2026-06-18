import { useParams } from "react-router-dom";

export default function LicitacionDetallePage() {
  const { id } = useParams();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Detalle de Licitación</h1>

      <div className="bg-white p-6 rounded shadow">
        <p>Estás viendo la licitación con ID:</p>

        <h2 className="text-xl font-semibold mt-2">
          {id}
        </h2>
      </div>
    </div>
  );
}