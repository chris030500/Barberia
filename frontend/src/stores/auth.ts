import { create } from "zustand";
import { refresh, logout as apiLogout } from "../api/auth";

type User = {
  id: number;
  nombre?: string;
  avatarUrl?: string;
  telefonoE164?: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;

  // Métodos
  setSession: (token: string | null, user?: User | null) => void;
  clear: () => void;
  refresh: () => Promise<string | null>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,

  /** Guarda o actualiza el token y usuario */
  setSession: (accessToken, user = null) => set({ accessToken, user }),

  /** Limpia por completo la sesión (logout local) */
  clear: () => set({ accessToken: null, user: null }),

  /** Intenta renovar el access token usando la cookie de refresh */
  refresh: async () => {
    try {
      const res = await refresh(); // tu endpoint /auth/refresh
      const token = res?.accessToken ?? null;

      if (token) {
        set({ accessToken: token });
        return token;
      }

      // si no devolvió token válido → limpiar
      set({ accessToken: null, user: null });
      return null;
    } catch (err) {
      console.warn("❌ Refresh falló:", err);
      set({ accessToken: null, user: null });
      return null;
    }
  },

  /** Cierra sesión tanto en backend como en store local */
  logout: async () => {
    try {
      await apiLogout(); // /auth/logout → limpia cookie refresh
    } catch (e) {
      console.warn("Error al hacer logout remoto:", e);
    } finally {
      set({ accessToken: null, user: null });
    }
  },
}));
