import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";
import ServiciosPage from "@/pages/Servicios";
import BarberosPage from "./pages/Barberos";
import CitasPage from "./pages/Citas";
import BookingPage from "./pages/Booking";
import CompletarPerfilPage from "./pages/CompletarPerfil";
import BarberoDisponibilidadPage from "./pages/BarberoDisponibilidadPage";
import { RequireRole } from "./RequiereRole";

export const router = createBrowserRouter([
  // RUTAS CON NAVBAR
  {
    element: <AppLayout />,
    children: [
      { path: "/login", element: <Login /> },

      {
        path: "/",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },

      {
        path: "/servicios",
        element: (
          <ProtectedRoute>
            <RequireRole roles={["ADMIN"]}>
              <ServiciosPage />
            </RequireRole>
          </ProtectedRoute>
        ),
      },

      {
        path: "/barberos",
        element: (
          <ProtectedRoute>
            <RequireRole roles={["ADMIN"]}>
              <BarberosPage />
            </RequireRole>
          </ProtectedRoute>
        ),
      },

      {
        path: "/citas",
        element: (
          <ProtectedRoute>
            <RequireRole roles={["ADMIN", "BARBERO"]}>
              <CitasPage />
            </RequireRole>
          </ProtectedRoute>
        ),
      },

      {
        path: "/booking",
        element: (
          <ProtectedRoute requireProfileComplete>
            <RequireRole roles={["CLIENTE", "ADMIN"]}>
              <BookingPage />
            </RequireRole>
          </ProtectedRoute>
        ),
      },

      {
        path: "/perfil/completar",
        element: (
          <ProtectedRoute>
            <CompletarPerfilPage />
          </ProtectedRoute>
        ),
      },

      // ✅ NUEVA PANTALLA DE DISPONIBILIDAD
      {
        path: "/disponibilidad",
        element: (
          <ProtectedRoute>
            <RequireRole roles={["ADMIN", "BARBERO"]}>
              <BarberoDisponibilidadPage />
            </RequireRole>
          </ProtectedRoute>
        ),
      },
    ],
  },

  // RUTAS SIN NAVBAR
  {
    path: "/login",
    element: <Login />,
  },
]);