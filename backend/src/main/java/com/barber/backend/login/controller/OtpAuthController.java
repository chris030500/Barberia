package com.barber.backend.login.controller;

import com.barber.backend.login.service.JwtService;
import com.barber.backend.login.service.OtpService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador para autenticación basada en OTP (teléfono/SMS).
 * 1) /enviar    -> genera y envía OTP
 * 2) /verificar -> valida OTP, emite access token y setea refresh cookie
 */
@RestController
@RequestMapping("/auth/otp")
public class OtpAuthController {

  private final OtpService otpService;
  private final JwtService jwt;
  private final SessionController sessionHelper; // para setear la cookie del refresh

  public OtpAuthController(
      OtpService otpService,
      JwtService jwt,
      SessionController sessionHelper
  ) {
    this.otpService = otpService;
    this.jwt = jwt;
    this.sessionHelper = sessionHelper;
  }

  @PostMapping(
      path = "/enviar",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> enviar(@RequestBody Map<String, String> body) {
    String tel = body.getOrDefault("telefono", "").trim();
    otpService.enviarLogin(tel);
    return ResponseEntity.ok(Map.of("ok", true, "enviado", true));
  }

  @PostMapping(
      path = "/verificar",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> verificar(
      @RequestBody Map<String, String> body,
      HttpServletRequest req,
      HttpServletResponse res
  ) {
    try {
      String tel  = body.getOrDefault("telefono", "").trim();
      String code = body.getOrDefault("codigo", "").trim();

      // 1) Validar OTP (lanza excepción si es inválido) y obtener info de usuario
      var result = otpService.verificarLogin(tel, code);
      Long userId = ((Number) result.get("usuarioId")).longValue();

      // 2) Emitir access token corto (JWT)
      String accessToken = jwt.issue(userId, "user-" + userId, List.of("USER"));

      // 3) Setear refresh token en cookie HttpOnly (usando tu helper)
      sessionHelper.attachRefreshCookie(req, res, userId);

      // 4) Responder al front con access token y datos mínimos
      return ResponseEntity.ok(Map.of(
          "ok", true,
          "usuarioId", userId,
          "telefono", result.get("telefono"),
          // 👇 nombre estandarizado que espera el front
          "accessToken", accessToken
      ));

    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "error", e.getMessage()
      ));
    }
  }
}
