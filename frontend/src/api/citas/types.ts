// api/citas/types.ts
export type CitaDTO = {
  id: number;
  barberoId: number;
  barberoNombre: string;
  servicioId: number;
  servicioNombre: string;
  clienteNombre: string;
  clienteTelE164?: string | null;
  inicio: string;
  fin: string;
  precioCentavos: number;               // <- ya resuelto por backend (override o base)
  estado: "AGENDADA" | "CANCELADA" | "COMPLETADA";
  notas?: string | null;
};

export type CitaSaveReq = {
  barberoId: number;
  servicioId: number;
  clienteNombre: string;
  clienteTelE164?: string | null;
  inicio: string;
  overrideDuracionMin?: number | null;
  overridePrecioCentavos?: number | null;
  notas?: string | null;
};

export type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // page index
  size: number;
};
