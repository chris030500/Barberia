import { http } from "./http";
import api from "../lib/api";

export async function enviarOtp(telefono: string) {
  return http.post("/auth/otp/enviar", { telefono }).then(r => r.data);
}

export async function verificarOtp(telefono: string, codigo: string) {
  // devuelve { ok, usuarioId, token, telefono }
  return http.post("/auth/otp/verificar", { telefono, codigo }).then(r => r.data);
}

export async function me(token?: string) {
  // si pasas token, úsalo; si no, intenta sin (puedes proteger /api/usuarios/me con JWT)
  return http.get("/api/usuarios/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  }).then(r => r.data);
}

export async function refresh(): Promise<{ accessToken: string | null }> {
  try {
    const res = await api.post("/auth/refresh", {});
    return { accessToken: res.data?.accessToken ?? null };
  } catch (e: any) {
    if (e?.response?.status === 401) return { accessToken: null };
    throw e;
  }
}

export async function logout() {
  await api.post("/auth/logout");
}
