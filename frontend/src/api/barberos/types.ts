export type BarberoDTO = {
  id: number;
  nombre: string;
  telefonoE164?: string | null;
  descripcion?: string | null;
  avatarUrl?: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn?: string | null;
  servicios: number[]; // IDs
};

export type BarberoSave = {
  nombre: string;
  telefonoE164?: string | null;
  descripcion?: string | null;
  avatarUrl?: string | null;
  activo?: boolean;
  servicios?: number[];
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page index
  size: number;
};

export type BarberoServicioResumen = {
  id: number;
  nombre: string;
  duracionMin: number | null;
  precioCentavos: number | null;
};

export type BarberoDisponibilidadBarbero = {
  id: number;
  nombre: string;
  telefonoE164?: string | null;
  descripcion?: string | null;
  avatarUrl?: string | null;
  activo: boolean;
  servicios: BarberoServicioResumen[];
};

export type BarberoDisponibilidadMetrics = {
  diasActivos: number;
  horasSemana: number;
  bloquesProximos: number;
  citasProximas: number;
  proximaCita?: string | null;
  proximoBloqueo?: string | null;
  serviciosActivos: number;
};

export type BarberoDisponibilidadCita = {
  id: number;
  inicio: string;
  fin: string;
  clienteNombre: string;
  servicioNombre: string | null;
  estado: string | null;
  precioCentavos: number | null;
};

export type BarberoDisponibilidadResumen = {
  barbero: BarberoDisponibilidadBarbero;
  horario: import("@/api/horario/horario-semanal").HorarioDia[];
  metrics: BarberoDisponibilidadMetrics;
  proximosBloqueos: import("@/api/horario/bloqueos").Bloqueo[];
  proximasCitas: BarberoDisponibilidadCita[];
};