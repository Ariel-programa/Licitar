import axios from "axios";
import { useAuthStore } from "./authStore";

const BASE = "https://licitar-production-1131.up.railway.app/api";

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh: cuando un request devuelve 401, intenta renovar el access token
let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const drainQueue = (error: unknown, token?: string) => {
  queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as typeof err.config & { _retry?: boolean };

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    const { refreshToken, updateToken, logout } = useAuthStore.getState();
    if (!refreshToken) {
      logout();
      window.location.href = "/login";
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE}/auth/refresh/`, { refresh: refreshToken });
      updateToken(data.access);
      drainQueue(null, data.access);
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (refreshErr) {
      drainQueue(refreshErr);
      logout();
      window.location.href = "/login";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
