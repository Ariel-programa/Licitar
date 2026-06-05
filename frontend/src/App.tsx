import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./lib/authStore";
import LoginPage from "./routes/LoginPage";
import DashboardPage from "./routes/DashboardPage";
import LicitacionesPage from "./routes/LicitacionesPage";
import AlertasPage from "./routes/AlertasPage";
import Layout from "./components/Layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          <Route path="alertas" element={<AlertasPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
