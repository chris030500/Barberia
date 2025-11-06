package com.barber.backend.agenda.dto;

import java.time.Instant;

public record BarberoDisponibilidadMetricsDTO(
    int diasActivos,
    double horasSemana,
    int bloquesProximos,
    int citasProximas,
    Instant proximaCita,
    Instant proximoBloqueo,
    int serviciosActivos
) {}
