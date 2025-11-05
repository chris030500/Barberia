package com.barber.backend.citas.dto;

import com.barber.backend.citas.model.Cita.Estado;
import java.time.Instant;

public record CitaDTO(
    Long id,
    Long barberoId,
    Long servicioId,
    String clienteNombre,
    String clienteTelE164,
    Instant inicio,
    Instant fin,
    Estado estado,
    Integer overrideDuracionMin,
    Integer overridePrecioCentavos,
    String notas,
    Instant creadoEn,
    Instant actualizadoEn
) {}