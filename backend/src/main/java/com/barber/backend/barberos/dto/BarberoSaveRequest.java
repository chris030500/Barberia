package com.barber.backend.barberos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BarberoSaveRequest(
    @NotBlank @Size(max = 120) String nombre,
    @Size(max = 20) String telefonoE164,
    @Size(max = 500) String descripcion,
    @Size(max = 300) String avatarUrl,
    @Email @Size(max = 160) String emailProfesional,
    @Size(max = 80) String instagramHandle,
    @Size(max = 300) String portafolioUrl,
    @Size(max = 160) String slogan,
    @Min(0) @Max(80) Integer experienciaAnos,
    List<@Size(max = 50) String> especialidades,
    Boolean activo,
    List<Long> servicios // IDs
) {}
