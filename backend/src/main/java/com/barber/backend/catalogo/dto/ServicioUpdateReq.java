package com.barber.backend.catalogo.dto;

import jakarta.validation.constraints.*;

public record ServicioUpdateReq(
    @NotBlank @Size(max = 120) String nombre,
    @Size(max = 500) String descripcion,
    @NotNull @Min(5) @Max(480) Integer duracionMin,
    @NotNull @Min(0) Integer precioCentavos,
    @NotNull Boolean activo
) {}