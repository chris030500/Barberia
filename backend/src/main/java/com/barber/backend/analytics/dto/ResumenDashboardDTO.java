package com.barber.backend.analytics.dto;

import java.time.Instant;
import java.util.List;

public record ResumenDashboardDTO(
        DashboardRole role,
        AdminDashboard admin,
        BarberoDashboard barbero,
        ClienteDashboard cliente
) {

    public enum DashboardRole { ADMIN, BARBERO, CLIENTE }

    public record AdminDashboard(
            long citasHoy,
            long citasSemana,
            long citasCanceladasSemana,
            long clientesActivos,
            long clientesVerificados,
            long nuevosClientesSemana,
            long barberosActivos,
            long serviciosActivos,
            long ingresosMesCentavos,
            long ingresosMesAnteriorCentavos,
            double variacionIngresosPorcentual
    ) {
        public AdminDashboard {
            if (Double.isNaN(variacionIngresosPorcentual) || Double.isInfinite(variacionIngresosPorcentual)) {
                variacionIngresosPorcentual = 0d;
            }
        }
    }

    public record BarberoDashboard(
            long citasHoy,
            long citasSemana,
            long citasCanceladasSemana,
            long citasCompletadasMes,
            long ingresosMesCentavos,
            List<BarberoProximaCita> proximasCitas
    ) {
    }

    public record BarberoProximaCita(
            long citaId,
            String cliente,
            String servicio,
            Instant inicio,
            Instant fin
    ) {
    }

    public record ClienteDashboard(
            boolean perfilCompleto,
            boolean telefonoVerificado,
            String nombrePreferido,
            long citasPendientes,
            long citasHistoricas,
            CitaCliente proximaCita,
            CitaCliente ultimaCita
    ) {
    }

    public record CitaCliente(
            long citaId,
            String barbero,
            String servicio,
            Instant inicio
    ) {
    }
}
