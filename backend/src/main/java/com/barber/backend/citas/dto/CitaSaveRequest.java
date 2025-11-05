package com.barber.backend.citas.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CitaSaveRequest(
    @NotNull Long barberoId,
    @NotNull Long servicioId,
    @NotNull String clienteNombre,
    String clienteTelE164,
    @NotNull Instant inicio,                // ISO desde el front
    Integer overrideDuracionMin,            // opcional
    Integer overridePrecioCentavos,         // opcional
    String notas
) {}