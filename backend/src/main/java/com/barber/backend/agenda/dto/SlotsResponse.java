// src/main/java/com/barber/backend/agenda/dto/SlotsResponse.java
package com.barber.backend.agenda.dto;

import java.util.List;

public record SlotsResponse(
    Long barberoId,
    Long servicioId,
    String fecha,         // eco
    Integer slotSizeMin,  // efectivo
    Integer duracionMin,  // efectiva
    List<SlotDTO> slots
) { }
