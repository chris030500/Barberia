package com.barber.backend.citas.dto;

import java.time.Instant;

public record CitaFilter(
    Long barberoId,
    Instant desde,    // inclusive
    Instant hasta,    // exclusive
    String estado     // opcional
) {}