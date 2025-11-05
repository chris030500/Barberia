// src/main/java/com/barber/backend/login/dto/ExchangeResponse.java
package com.barber.backend.login.dto;

public record ExchangeResponse(
    boolean ok,
    String accessToken,
    UsuarioMeDTO user
) {}
