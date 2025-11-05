package com.barber.backend.catalogo.dto;

public record ServicioDTO(
    Long id,
    String nombre,
    String descripcion,
    Integer duracionMin,
    Integer precioCentavos,
    boolean activo
) {}