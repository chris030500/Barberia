import api from "../lib/api";

export async function enviarOtp(telefono: string) {
  const { data } = await api.post("/auth/otp/enviar", { telefono });
  return data;
}

export async function verificarOtp(telefono: string, codigo: string) {
  const { data } = await api.post("/auth/otp/verificar", { telefono, codigo });
  // data: { ok, usuarioId, token, telefono }
  return data;
}

// Stubs (los conectaremos tras integrar SDKs)
export async function loginGoogle(idToken: string) {
  const { data } = await api.post("/auth/google", { idToken });
  return data;
}

export async function loginFacebook(accessToken: string) {
  const { data } = await api.post("/auth/facebook", { accessToken });
  return data;
}

export async function refresh() {
  const { data } = await api.post("/auth/refresh", {}); // 👈 relativa
  return { accessToken: data?.accessToken ?? null };
}

export async function logout() {
  await api.post("/auth/logout", {}); // 👈 relativa
}