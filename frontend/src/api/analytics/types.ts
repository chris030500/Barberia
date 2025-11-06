export type DashboardRole = "ADMIN" | "BARBERO" | "CLIENTE";

export type DashboardAdminMetrics = {
  citasHoy: number;
  citasSemana: number;
  citasCanceladasSemana: number;
  clientesActivos: number;
  clientesVerificados: number;
  nuevosClientesSemana: number;
  barberosActivos: number;
  serviciosActivos: number;
  ingresosMesCentavos: number;
  ingresosMesAnteriorCentavos: number;
  variacionIngresosPorcentual: number;
};

export type BarberoProximaCita = {
  citaId: number;
  cliente: string;
  servicio: string;
  inicio: string;
  fin: string;
};

export type DashboardBarberoMetrics = {
  citasHoy: number;
  citasSemana: number;
  citasCanceladasSemana: number;
  citasCompletadasMes: number;
  ingresosMesCentavos: number;
  proximasCitas: BarberoProximaCita[];
};

export type ClienteCitaResumen = {
  citaId: number;
  barbero: string;
  servicio: string;
  inicio: string;
};

export type DashboardClienteMetrics = {
  perfilCompleto: boolean;
  telefonoVerificado: boolean;
  nombrePreferido: string;
  citasPendientes: number;
  citasHistoricas: number;
  proximaCita: ClienteCitaResumen | null;
  ultimaCita: ClienteCitaResumen | null;
};

export type DashboardResumen = {
  role: DashboardRole;
  admin: DashboardAdminMetrics | null;
  barbero: DashboardBarberoMetrics | null;
  cliente: DashboardClienteMetrics | null;
};
