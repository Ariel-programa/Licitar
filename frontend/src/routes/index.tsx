import LicitacionDetallePage from "@/pages/LicitacionDetallePage";
import { createBrowserRouter } from "react-router-dom";
import LicitacionesPage from "@/pages/LicitacionesPage";


export const router = createBrowserRouter([
{
  path: "/licitaciones/:id",
  element: <LicitacionDetallePage />
}
  {
    path: "/licitaciones/:id",
    element: <LicitacionDetallePage />
  }
]);