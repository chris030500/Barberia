package com.barber.backend.barberos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BarberoSaveRequest(
    @NotBlank @Size(max = 120) String nombre,
    @Size(max = 20) String telefonoE164,
    @Size(max = 500) String descripcion,
    @Size(max = 300) String avatarUrl,
    Boolean activo,
    List<Long> servicios // IDs
) {}