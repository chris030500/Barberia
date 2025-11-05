// api/citas/index.ts
import { http } from "@/api/http";
import type { Page, CitaDTO, CitaSaveReq } from "./types";

export async function listCitas(params: {
  barberoId?: number;
  estado?: "AGENDADA" | "CANCELADA" | "COMPLETADA";
  desde: string; // ISO
  hasta: string; // ISO
  page: number;
  size: number;
  sort?: string;
}): Promise<Page<CitaDTO>> {
  const { data } = await http.get<Page<CitaDTO>>("/api/citas", { params });
  return data;
}

export async function getCita(id: number): Promise<CitaDTO> {
  const { data } = await http.get<CitaDTO>(`/api/citas/${id}`);
  return data;
}

export async function createCita(body: CitaSaveReq): Promise<CitaDTO> {
  const { data } = await http.post<CitaDTO>("/api/citas", body);
  return data;
}

export async function updateCita(id: number, body: CitaSaveReq): Promise<CitaDTO> {
  const { data } = await http.put<CitaDTO>(`/api/citas/${id}`, body);
  return data;
}

export async function completarCita(id: number): Promise<CitaDTO> {
  const { data } = await http.post<CitaDTO>(`/api/citas/${id}/completar`, {});
  return data;
}

export async function cancelarCita(id: number): Promise<CitaDTO> {
  const { data } = await http.post<CitaDTO>(`/api/citas/${id}/cancelar`, {});
  return data;
}

export async function deleteCita(id: number): Promise<void> {
  await http.delete<void>(`/api/citas/${id}`);
}