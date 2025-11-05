import { http } from "@/api/http";

export type SlotDTO = {
  inicio: string; // ISO
  fin: string;    // ISO
};

export type SlotsResponse = {
  barberoId: number;
  servicioId: number;
  fecha: string;        // YYYY-MM-DD
  slotSizeMin: number;
  duracionMin: number;
  slots: SlotDTO[];     // lista de bloques horarios
};

export async function getSlots(params: {
  barberoId: number;
  servicioId: number;
  fecha: string;
  slotSizeMin?: number;
  duracionMin?: number;
}): Promise<SlotsResponse> {
  const { data } = await http.post<SlotsResponse>("/api/agenda/slots", {
    barberoId: params.barberoId,
    servicioId: params.servicioId,
    fecha: params.fecha,
    slotSizeMin: params.slotSizeMin ?? 15,
    duracionMin: params.duracionMin ?? 20,
  });
  return data; // 🔹 ahora regresa solo el objeto con `slots`
}
