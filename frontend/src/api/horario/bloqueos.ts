import { http } from "@/api/http";

export type Bloqueo = {
  id: number;
  inicio: string;   // ISO
  fin: string;      // ISO
  motivo?: string | null;
  creadoEn?: string;
};

export type BloqueoCreateReq = {
  inicio: string;   // ISO
  fin: string;      // ISO
  motivo?: string | null;
};

type BloqueoQuery = {
  desde?: string;
  hasta?: string;
  fecha?: string;
};

export async function listBloqueos(barberoId: number, params?: BloqueoQuery): Promise<Bloqueo[]> {
  const { data } = await http.get<Bloqueo[]>(`/api/barberos/${barberoId}/bloqueos`, {
    params,
  });
  return data;
}

export async function createBloqueo(barberoId: number, body: BloqueoCreateReq): Promise<Bloqueo> {
  const { data } = await http.post<Bloqueo>(`/api/barberos/${barberoId}/bloqueos`, body);
  return data;
}

export async function deleteBloqueo(barberoId: number, bloqueoId: number): Promise<void> {
  await http.delete<void>(`/api/barberos/${barberoId}/bloqueos/${bloqueoId}`);
}