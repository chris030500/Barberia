// src/main/java/com/barber/backend/agenda/dto/BarberoHorarioDTO.java
package com.barber.backend.agenda.dto;

public record BarberoHorarioDTO(
    Integer dow,      // 0=domingo ... 6=sábado
    String  desde,    // "HH:mm"
    String  hasta,    // "HH:mm"
    Boolean activo
) {}