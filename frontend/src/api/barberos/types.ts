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