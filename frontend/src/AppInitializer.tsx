// src/AppInitializer.tsx
import { ReactNode, useEffect, useRef } from "react";
import { useAuth } from "@/stores/auth";
import { http } from "@/api/http" // <- usa tu axios con interceptores
import {
  onIdTokenChanged,
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signOut,
  User,
} from "firebase/auth";
import { initializeApp, getApps, getApp } from "firebase/app";
import toast from "react-hot-toast";

// --- Firebase config ---
const fbConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

// Singleton seguro
const app = getApps().length ? getApp() : initializeApp(fbConfig);
const auth = getAuth(app);

// --- util: canje con reintentos ---
async function exchangeWithBackoff(idToken: string, abortSignal?: AbortSignal) {
  const url = `${import.meta.env.VITE_API_URL}/auth/firebase/exchange`;
  let attempt = 0;
  let lastError: any;

  while (attempt < 3) {
    try {
      const res = await http.post(
        url,
        { idToken },
        { signal: abortSignal }
      );
      return res.data as { ok: boolean; accessToken: string; user: any };
    } catch (err: any) {
      // Si es cancelado/aborted, revienta de inmediato
      if (abortSignal?.aborted) throw err;

      // Si el backend contesta 4xx ≠ 429, no tiene caso reintentar
      const status = err?.response?.status;
      if (status && status < 500 && status !== 429) {
        throw err;
      }

      lastError = err;
      // backoff exponencial: 250ms, 750ms
      const delay = 250 * (attempt === 0 ? 1 : 3);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
  throw lastError;
}

export default function AppInitializer({ children }: { children: ReactNode }) {
  const setSession = useAuth((s) => s.setSession);

  const lastExchangedToken = useRef<string | null>(null);
  const lastExchangeAt = useRef<number>(0);
  const inflight = useRef<Promise<void> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Opcional: refrescar ID token cuando la pestaña vuelve a foco
  useEffect(() => {
    const onFocus = async () => {
      const u = auth.currentUser;
      if (!u) return;
      try {
        // fuerza refresh suave (si Firebase decide que hace falta lo renovará)
        await u.getIdToken(true);
      } catch {}
    };
    window.addEventListener("visibilitychange", onFocus, { passive: true });
    window.addEventListener("focus", onFocus, { passive: true });
    return () => {
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const unsub = onIdTokenChanged(auth, async (fbUser: User | null) => {
      // Si se cierra sesión en Firebase
      if (!fbUser) {
        lastExchangedToken.current = null;
        lastExchangeAt.current = 0;
        setSession(null, null);
        // cancela cualquier canje en curso
        abortRef.current?.abort();
        abortRef.current = null;
        inflight.current = null;
        return;
      }

      try {
        const idToken = await fbUser.getIdToken();

        // 1) si es el mismo token que ya canjeamos recientemente, no repitas
        if (idToken && idToken === lastExchangedToken.current) {
          return;
        }

        // 2) antirrebote temporal (p.ej. 2 seg) para ráfagas de onIdTokenChanged
        const now = Date.now();
        if (now - lastExchangeAt.current < 2000) {
          return;
        }

        // 3) evita doble petición si ya hay una en curso
        if (!inflight.current) {
          inflight.current = (async () => {
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            const data = await exchangeWithBackoff(
              idToken,
              abortRef.current.signal
            );

            // si backend devolvió 401, nuestra capa http ya te manda a /login,
            // pero por si acaso:
            if (!data?.ok || !data?.accessToken) {
              throw new Error("No se pudo canjear el token");
            }

            lastExchangedToken.current = idToken;
            lastExchangeAt.current = Date.now();
            setSession(data.accessToken, data.user);
          })();
        }

        await inflight.current;
      } catch (e: any) {
        // Si el error vino por abort, ignoramos
        if (e?.name === "CanceledError" || e?.name === "AbortError") {
          return;
        }
        // Si el backend dijo 401, el interceptor ya te redirigió; solo limpia estado
        await signOut(auth).catch(() => {});
        lastExchangedToken.current = null;
        lastExchangeAt.current = 0;
        setSession(null, null);
        toast.error(e?.message ?? "Error de sesión");
      } finally {
        inflight.current = null;
      }
    });

    return () => {
      unsub();
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [setSession]);

  return <>{children}</>;
}