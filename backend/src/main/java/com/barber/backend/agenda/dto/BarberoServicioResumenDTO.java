package com.barber.backend.agenda.dto;

public record BarberoServicioResumenDTO(
    Long id,
    String nombre,
    Integer duracionMin,
    Integer precioCentavos
) {}
