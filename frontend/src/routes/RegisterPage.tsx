import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { loginWithGoogle } from "@/services/auth";

const schema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  empresa: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputCls =
  "w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: FormData) => api.post("/auth/register/", data),
    onSuccess: async (_, variables) => {
      const { data } = await api.post("/auth/login/", {
        email: variables.email,
        password: variables.password,
      });
      setAuth(data.access, { email: data.email, role: data.role }, data.refresh, false);
      navigate("/dashboard");
    },
  });

  const googleMutation = useMutation({
    mutationFn: (credential: string) => loginWithGoogle(credential),
    onSuccess: (data) => {
      setAuth(data.access, { email: data.email, role: data.role }, data.refresh, true);
      navigate("/dashboard");
    },
  });

  const errorMsg = (() => {
    const e = error ?? googleMutation.error;
    if (!e) return null;
    if (axios.isAxiosError(e) && e.response?.data) {
      const d = e.response.data as Record<string, string[] | string>;
      return Object.entries(d)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join(" · ");
    }
    return "Error al registrarse";
  })();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Crear cuenta</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Registrate en LicitAR</p>

        {/* Google primero */}
        <div className="flex justify-center mb-5">
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <GoogleLogin
              onSuccess={(cred) => cred.credential && googleMutation.mutate(cred.credential)}
              onError={() => googleMutation.reset()}
              text="signup_with"
            />
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Google OAuth no configurado — agregá <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> al <code>.env</code>
            </p>
          )}
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400 dark:text-gray-500">
            <span className="bg-white dark:bg-gray-900 px-2">o registrate con email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario</label>
            <input {...register("username")} className={inputCls} />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" {...register("email")} className={inputCls} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
            <input type="password" {...register("password")} className={inputCls} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa (opcional)</label>
            <input {...register("empresa")} className={inputCls} />
          </div>

          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

          <button
            type="submit"
            disabled={isPending || googleMutation.isPending}
            className="w-full bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Registrando..." : "Crear cuenta"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="text-primary-600 hover:underline">Ingresá</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
