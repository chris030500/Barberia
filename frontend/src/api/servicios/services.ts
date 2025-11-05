// src/api/servicios/services.ts
import { http } from "@/api/http";

export type ServicioDTO = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  duracionMin: number;
  precioCentavos: number;
  activo: boolean;
};

export type ServicioCreateReq = {
  nombre: string;
  descripcion?: string | null;
  duracionMin: number;
  precioCentavos: number;
  activo?: boolean;
};

export type ServicioUpdateReq = {
  nombre: string;
  descripcion?: string | null;
  duracionMin: number;
  precioCentavos: number;
  activo: boolean;
};

export type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

// 🔧 Normaliza para devolver SIEMPRE el Page<T> (no el response)
export async function listServicios(params: {
  page?: number;
  size?: number;
  sort?: string;       // "nombre,asc"
  soloActivos?: boolean;
}) {
  const { page = 0, size = 10, sort = "nombre,asc", soloActivos } = params || {};
  const q = new URLSearchParams({ page: String(page), size: String(size), sort });
  if (soloActivos != null) q.set("soloActivos", String(soloActivos));

  const res = await http.get<Page<ServicioDTO>>(`/api/servicios?${q.toString()}`);
  const data = (res as any)?.data ?? res; // soporta axios-like o fetch-like
  return data as Page<ServicioDTO>;
}

export function getServicio(id: number) {
  return http.get<ServicioDTO>(`/api/servicios/${id}`).then((r: any) => r?.data ?? r);
}

export function createServicio(body: ServicioCreateReq) {
  return http.post<ServicioDTO>("/api/servicios", body).then((r: any) => r?.data ?? r);
}

export function updateServicio(id: number, body: ServicioUpdateReq) {
  return http.put<ServicioDTO>(`/api/servicios/${id}`, body).then((r: any) => r?.data ?? r);
}

export function deleteServicio(id: number) {
  return http.delete<void>(`/api/servicios/${id}`).then((r: any) => r?.data ?? r);
}

/* Helper para selects/chips: devuelve siempre un arreglo {id,nombre} */
export type ServicioLite = { id: number; nombre: string };

export async function listServiciosLite(options?: {
  page?: number;
  size?: number;
  sort?: string;
  soloActivos?: boolean;
}): Promise<ServicioLite[]> {
  const page = await listServicios({
    page: options?.page ?? 0,
    size: options?.size ?? 500,
    sort: options?.sort ?? "nombre,asc",
    soloActivos: options?.soloActivos,
  });

  const content = Array.isArray(page?.content) ? page.content : [];
  return content.map(s => ({ id: s.id, nombre: s.nombre }));
}