import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./lib/authStore";
import Toaster from "./components/Toaster";
import LoginPage from "./routes/LoginPage";
import DashboardPage from "./routes/DashboardPage";
import LicitacionesPage from "./routes/LicitacionesPage";
import AlertasPage from "./routes/AlertasPage";
import Layout from "./components/Layout";
import RegisterPage from "./routes/RegisterPage";
import NuevaLicitacionPage from "./routes/NuevaLicitacionPage";
import EditarLicitacionPage from "./routes/EditarLicitacionPage";
import DetalleLicitacionPage from "./routes/DetalleLicitacionPage";
import UsuariosPage from "./routes/UsuariosPage";
import PerfilPage from "./routes/PerfilPage";
import FavoritosPage from "./routes/FavoritosPage";
import ResultadosScrapingPage from "./routes/ResultadosScrapingPage";
import EstadisticasPage from "./routes/EstadisticasPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="licitaciones" element={<LicitacionesPage />} />
          <Route path="licitaciones/nueva" element={<NuevaLicitacionPage />} />
          <Route path="licitaciones/:id/editar" element={<EditarLicitacionPage />} />
          <Route path="licitaciones/:id" element={<DetalleLicitacionPage />} />
          <Route path="resultados" element={<ResultadosScrapingPage />} />
          <Route path="estadisticas" element={<EstadisticasPage />} />
          <Route path="alertas" element={<AlertasPage />} />
          <Route path="favoritos" element={<FavoritosPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}