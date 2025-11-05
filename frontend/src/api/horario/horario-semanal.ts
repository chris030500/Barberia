import { http } from "@/api/http";

export type HorarioDia = {
  id?: number;
  dow: number;           // 0=domingo ... 6=sábado
  activo: boolean;
  desde: string;         // "HH:mm"
  hasta: string;         // "HH:mm"
};

export async function getHorario(barberoId: number): Promise<HorarioDia[]> {
  const { data } = await http.get<HorarioDia[]>(`/api/barberos/${barberoId}/horario-semanal`);
  return data;
}

export async function saveHorario(barberoId: number, dias: HorarioDia[]): Promise<HorarioDia[]> {
  const { data } = await http.put<HorarioDia[]>(`/api/barberos/${barberoId}/horario-semanal`, dias);
  return data;
}