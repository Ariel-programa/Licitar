import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: { email: string; role: string } | null;
  rememberMe: boolean;
  setAuth: (token: string, user: AuthState["user"], refreshToken?: string, rememberMe?: boolean) => void;
  updateToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      rememberMe: false,
      setAuth: (token, user, refreshToken, rememberMe = false) => {
        set({ token, user, refreshToken: refreshToken ?? null, rememberMe });
        if (!rememberMe) {
          // Marca sesión activa solo para esta pestaña/ventana
          sessionStorage.setItem("licitar_session", "1");
        } else {
          sessionStorage.removeItem("licitar_session");
        }
      },
      updateToken: (token) => set({ token }),
      logout: () => {
        sessionStorage.removeItem("licitar_session");
        set({ token: null, refreshToken: null, user: null, rememberMe: false });
      },
    }),
    { name: "licitar-auth" }
  )
);

// Al iniciar: si el usuario no marcó "recordarme" y la sesión no está activa (nueva ventana/browser), limpiar
const { token, rememberMe, logout } = useAuthStore.getState();
if (token && !rememberMe && !sessionStorage.getItem("licitar_session")) {
  logout();
} else if (token && !rememberMe) {
  // Renovar marca de sesión activa
  sessionStorage.setItem("licitar_session", "1");
}

export const useIsEditor = () => {
  const user = useAuthStore((s) => s.user);
  return user?.role === "admin" || user?.role === "analyst";
};
