import axios from "axios";
import { useAuth } from "../stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  withCredentials: true, // para enviar/recibir cookie refresh
});

// Inyecta access token
api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh automático si 401
let refreshing = false;
let pending: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (refreshing) {
        await new Promise<void>((resolve) => pending.push(resolve));
      } else {
        try {
          refreshing = true;
          await axios.post(
            (import.meta.env.VITE_API_URL ?? "http://localhost:8080") + "/auth/refresh",
            {},
            { withCredentials: true }
          );
          pending.forEach((r) => r());
          pending = [];
        } catch {
          useAuth.getState().setSession(null);
          throw error;
        } finally {
          refreshing = false;
        }
      }
      return api(original);
    }
    throw error;
  }
);

export default api;
