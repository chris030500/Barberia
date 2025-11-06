import { http } from "@/api/http";
import type { UpdateMePayload, UsuarioMe } from "./types";

export async function updateUsuarioMe(payload: UpdateMePayload) {
  const { data } = await http.put<UsuarioMe>("/api/usuarios/me", payload);
  return data;
}