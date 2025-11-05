// src/main/java/com/barber/backend/agenda/dto/SlotDTO.java
package com.barber.backend.agenda.dto;

import java.time.Instant;

public record SlotDTO(Instant inicio, Instant fin) { }
