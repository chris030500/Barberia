import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Dashboard from "./views/Dashboard";
import Auth from "./views/Auth";
import ProtectedRoute from "./routes/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Redirige raíz → dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // Página de autenticación (login OTP / social)
      { path: "auth", element: <Auth /> },

      // Rutas privadas
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          // Puedes agregar más rutas privadas aquí:
          // { path: "perfil", element: <Perfil /> },
        ],
      },

      // Fallback si la ruta no existe
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
