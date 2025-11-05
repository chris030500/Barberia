// src/main/java/com/barber/backend/agenda/dto/BarberoBloqueoSaveRequest.java
package com.barber.backend.agenda.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record BarberoBloqueoSaveRequest(
    @NotNull Instant inicio,
    @NotNull Instant fin,
    String motivo
) {}