package com.barber.backend.analytics.dto;

public record ResumenDashboardDTO(
    long citasHoy,
    long citasSemana,
    long citasCanceladasSemana,
    long clientesActivos,
    long barberosActivos,
    long ingresosMesCentavos,
    long ingresosMesAnteriorCentavos,
    double variacionIngresosPorcentual
) {
    public ResumenDashboardDTO {
        if (Double.isNaN(variacionIngresosPorcentual) || Double.isInfinite(variacionIngresosPorcentual)) {
            variacionIngresosPorcentual = 0d;
        }
    }
}
