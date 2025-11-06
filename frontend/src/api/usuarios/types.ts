export type Role = "ADMIN" | "BARBERO" | "CLIENTE";

export type UsuarioMe = {
  id: number;
  nombre: string;
  apellido: string;
  email: string | null;
  username: string;
  telefonoE164: string | null;
  telefonoVerificado: boolean;
  proveedor: string | null;
  proveedorId: string | null;
  avatarUrl: string | null;
  roles: string[];
  barberoId: number | null;
  clienteId: number | null;
};

export type UpdateMePayload = {
  nombre?: string;
  apellido?: string;
  username?: string;
  avatarUrl?: string;
  telefonoE164?: string;
};