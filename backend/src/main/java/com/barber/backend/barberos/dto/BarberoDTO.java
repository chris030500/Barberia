package com.barber.backend.barberos.dto;

import java.time.Instant;
import java.util.List;

public record BarberoDTO(
    Long id,
    String nombre,
    String telefonoE164,
    String descripcion,
    String avatarUrl,
    Boolean activo,
    Instant creadoEn,
    Instant actualizadoEn,
    List<Long> servicios // IDs de servicios asociados
) {}