package com.barber.backend.agenda.dto;

import java.time.Instant;

public record BarberoDisponibilidadCitaDTO(
    Long id,
    Instant inicio,
    Instant fin,
    String clienteNombre,
    String servicioNombre,
    String estado,
    Integer precioCentavos
) {}
