import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Spinner from "@/components/Spinner";
import { useAuthStore } from "@/lib/authStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface Usuario {
  id: number;
  email: string;
  username: string;
  role: string;
  empresa: string;
  is_active: boolean;
  created_at: string;
}

export default function UsuariosPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (user?.role !== "admin") navigate("/dashboard");
  }, [user]);

  const { data: usuarios, isLoading } = useQuery<Usuario[]>({
    queryKey: ["usuarios"],
    queryFn: async () => (await api.get("/auth/usuarios/")).data.results,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Usuario> }) =>
      api.patch(`/auth/usuarios/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const rolColor: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800",
    analyst: "bg-blue-100 text-blue-800",
    viewer: "bg-gray-100 text-gray-700",
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-sm text-gray-500 mt-1">{usuarios?.length ?? 0} usuarios registrados</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Empresa</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Registro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios?.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.username}</td>
                <td className="px-4 py-3 text-gray-600">{u.empresa || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateMutation.mutate({ id: u.id, data: { role: e.target.value } })}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${rolColor[u.role]}`}
                    disabled={u.email === user?.email}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => updateMutation.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                    disabled={u.email === user?.email}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    } disabled:opacity-50`}
                  >
                    {u.is_active ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}