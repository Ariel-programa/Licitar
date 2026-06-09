import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Bell, LogOut, Users, Star, User } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import clsx from "clsx";
import Notificaciones from "./Notificaciones";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/licitaciones", icon: FileText, label: "Licitaciones" },
    { to: "/favoritos", icon: Star, label: "Favoritos" },
    { to: "/alertas", icon: Bell, label: "Alertas" },
    ...(user?.role === "admin" ? [{ to: "/usuarios", icon: Users, label: "Usuarios" }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-700">LicitAR</h1>
          <p className="text-xs text-gray-500 mt-1">Licitaciones publicas de salud</p>
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
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => navigate("/perfil")}
            className="flex items-center gap-2 w-full mb-3 text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <User size={16} />
            <div className="text-left">
              <p className="truncate">{user?.email}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} /> Cerrar sesion
          </button>
        </div>
      </aside>

     <main className="flex-1 overflow-auto">
  <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-6">
    <Notificaciones />
  </div>
  <Outlet />
</main>
    </div>
  );
}