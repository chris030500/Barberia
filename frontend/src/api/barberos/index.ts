import { http } from "@/api/http";
import type {
  BarberoDTO,
  BarberoDisponibilidadResumen,
  BarberoSave,
  Page,
} from "./types";

export async function listBarberos(params: { page?: number; size?: number; soloActivos?: boolean }) {
  const { page = 0, size = 10, soloActivos } = params ?? {};
  const res = await http.get<Page<BarberoDTO>>("/api/barberos", {
    params: { page, size, soloActivos },
  });
  return res.data;
}

export async function getBarbero(id: number) {
  const res = await http.get<BarberoDTO>(`/api/barberos/${id}`);
  return res.data;
}

export async function createBarbero(payload: BarberoSave) {
  const res = await http.post<BarberoDTO>("/api/barberos", payload);
  return res.data;
}

export async function updateBarbero(id: number, payload: BarberoSave) {
  const res = await http.put<BarberoDTO>(`/api/barberos/${id}`, payload);
  return res.data;
}

export async function deleteBarbero(id: number) {
  await http.delete(`/api/barberos/${id}`);
}
export type BarberoLite = { id: number; nombre: string; activo: boolean };

export async function listBarberosLite() {
  // página grande para select
  const res = await http.get<{ content: BarberoLite[] }>(
    "/api/barberos?page=0&size=1000&soloActivos=true&sort=nombre,asc"
  );
  return res.data.content;
}

export async function getBarberoDisponibilidadResumen(barberoId: number) {
  const res = await http.get<BarberoDisponibilidadResumen>(
    `/api/barberos/${barberoId}/disponibilidad/resumen`
  );
  return res.data;
}