import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/stores/auth";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  withCredentials: true,
});

// 🟢 Interceptor de request
http.interceptors.request.use((config) => {
  const { accessToken } = useAuth.getState();

  if (accessToken) {
    // 🔧 asegúrate de inicializar headers correctamente
    if (!config.headers) {
      config.headers = new axios.AxiosHeaders();
    }

    // Añade el Authorization header
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

// 🔴 Interceptor de response
http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error?.response?.status;

    if (status === 401) {
      const { logout } = useAuth.getState();
      await logout();
      if (location.pathname !== "/login") {
        toast.error("Tu sesión ha expirado. Inicia sesión nuevamente.");
        location.href = "/login";
      }
    } else if (status === 403) {
      toast.error("Acceso denegado. No tienes permisos suficientes.");
    } else if (status && status >= 500) {
      toast.error("Error del servidor. Intenta de nuevo más tarde.");
    } else if (!error.response) {
      toast.error("Sin conexión con el servidor.");
    }

    return Promise.reject(error);
  }
);