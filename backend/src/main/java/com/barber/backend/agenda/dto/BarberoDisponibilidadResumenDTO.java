package com.barber.backend.agenda.dto;

import java.util.List;

public record BarberoDisponibilidadResumenDTO(
    BarberoDisponibilidadBarberoDTO barbero,
    List<BarberoHorarioDTO> horario,
    BarberoDisponibilidadMetricsDTO metrics,
    List<BarberoBloqueoDTO> proximosBloqueos,
    List<BarberoDisponibilidadCitaDTO> proximasCitas
) {}
