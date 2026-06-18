import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import Spinner from "@/components/Spinner";

const schema = z.object({
  username: z.string().min(3, "Minimo 3 caracteres"),
  empresa: z.string().optional(),
  telefono: z.string().optional(),
});

const schemaPassword = z.object({
  password: z.string().min(8, "Minimo 8 caracteres"),
  confirmar: z.string(),
}).refine((d) => d.password === d.confirmar, {
  message: "Las contraseñas no coinciden",
  path: ["confirmar"],
});

type FormData = z.infer<typeof schema>;
type PasswordData = z.infer<typeof schemaPassword>;

export default function PerfilPage() {
  const qc = useQueryClient();
  const { setAuth, token } = useAuthStore();

  const { data: perfil, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/auth/me/")).data,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: perfil,
  });

  const { register: regPass, handleSubmit: handlePass, formState: { errors: errPass }, reset: resetPass } = useForm<PasswordData>({
    resolver: zodResolver(schemaPassword),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.patch("/auth/me/", data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setAuth(token!, { email: res.data.email, role: res.data.role });
    },
  });

  const passMutation = useMutation({
    mutationFn: (data: PasswordData) => api.patch("/auth/me/", { password: data.password }),
    onSuccess: () => resetPass(),
  });

  if (isLoading) return <Spinner />;

  const rolLabel: Record<string, string> = {
    admin: "Administrador",
    analyst: "Analista",
    viewer: "Visualizador",
  };

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h2>

      {/* Info basica */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">
            {perfil?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{perfil?.email}</p>
            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
              {rolLabel[perfil?.role] ?? perfil?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              {...register("username")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <input
              {...register("empresa")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input
              {...register("telefono")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {updateMutation.isSuccess && (
            <p className="text-green-600 text-sm">Perfil actualizado correctamente</p>
          )}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-primary-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Cambiar contraseña</h3>
        <form onSubmit={handlePass((data) => passMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              {...regPass("password")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errPass.password && <p className="text-red-500 text-xs mt-1">{errPass.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              {...regPass("confirmar")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errPass.confirmar && <p className="text-red-500 text-xs mt-1">{errPass.confirmar.message}</p>}
          </div>

          {passMutation.isSuccess && (
            <p className="text-green-600 text-sm">Contraseña actualizada correctamente</p>
          )}

          <button
            type="submit"
            disabled={passMutation.isPending}
            className="bg-gray-800 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
          >
            {passMutation.isPending ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}