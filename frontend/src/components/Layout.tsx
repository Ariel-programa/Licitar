import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Bell, LogOut, Users, Star, User, Search, BarChart2 } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import clsx from "clsx";
import Notificaciones from "./Notificaciones";

function GlobalSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.startsWith("/licitaciones")) setQ("");
  }, [location.pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/licitaciones?search=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-72">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Buscar licitaciones..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />
    </form>
  );
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/licitaciones", icon: FileText, label: "Licitaciones" },
    { to: "/estadisticas", icon: BarChart2, label: "Estadísticas" },
    { to: "/favoritos", icon: Star, label: "Favoritos" },
    { to: "/alertas", icon: Bell, label: "Alertas" },
    ...(user?.role === "admin" ? [{ to: "/usuarios", icon: Users, label: "Usuarios" }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-primary-700 dark:text-primary-400">LicitAR</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Licitaciones públicas de salud</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => navigate("/perfil")}
            className="flex items-center gap-2 w-full mb-3 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <User size={16} />
            <div className="text-left">
              <p className="truncate">{user?.email}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user?.role}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4">
          <GlobalSearch />
          <div className="flex-1" />
          <Notificaciones />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
