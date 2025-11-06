package com.barber.backend.agenda.dto;

import java.util.List;

public record BarberoDisponibilidadBarberoDTO(
    Long id,
    String nombre,
    String telefonoE164,
    String descripcion,
    String avatarUrl,
    String emailProfesional,
    String instagramHandle,
    String portafolioUrl,
    String slogan,
    Integer experienciaAnos,
    List<String> especialidades,
    Boolean activo,
    List<BarberoServicioResumenDTO> servicios
) {}
