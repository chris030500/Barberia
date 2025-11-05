// src/main/java/com/barber/backend/agenda/dto/SlotsRequest.java
package com.barber.backend.agenda.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record SlotsRequest(
    @NotNull Long barberoId,
    @NotNull Long servicioId,
    // yyyy-MM-dd
    @NotNull @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "fecha debe ser yyyy-MM-dd")
    String fecha,
    @Min(1) Integer slotSizeMin,
    @Min(1) Integer duracionMin
) {}