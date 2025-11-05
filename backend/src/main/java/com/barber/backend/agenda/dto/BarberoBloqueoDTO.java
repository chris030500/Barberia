// src/main/java/com/barber/backend/agenda/dto/BarberoBloqueoDTO.java
package com.barber.backend.agenda.dto;

import java.time.Instant;

public record BarberoBloqueoDTO(
    Long id,
    Long barberoId,
    Instant inicio,
    Instant fin,
    String motivo
) {}