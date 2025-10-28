package com.barber.backend.login.controller;

import com.barber.backend.login.service.JwtService;
import com.barber.backend.login.service.OtpService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador para autenticación basada en OTP (teléfono/SMS).
 * 1) /enviar -> genera y envía OTP
 * 2) /verificar -> valida OTP, emite access token y setea refresh cookie
 */
@RestController
@RequestMapping("/auth/otp")
public class OtpAuthController {

  private final OtpService otpService;
  private final JwtService jwt;
  private final SessionController sessionHelper;

  public OtpAuthController(OtpService otpService,
      JwtService jwt,
      SessionController sessionHelper) {
    this.otpService = otpService;
    this.jwt = jwt;
    this.sessionHelper = sessionHelper;
  }

  @PostMapping("/enviar")
  public ResponseEntity<?> enviar(@RequestBody Map<String, String> body) {
    String tel = body.getOrDefault("telefono", "");
    otpService.enviarLogin(tel);
    return ResponseEntity.ok(Map.of("enviado", true));
  }

  @PostMapping("/verificar")
  public ResponseEntity<?> verificar(@RequestBody Map<String, String> body,
      HttpServletRequest req,
      HttpServletResponse res) {
    try {
      String tel = body.getOrDefault("telefono", "");
      String code = body.getOrDefault("codigo", "");

      var result = otpService.verificarLogin(tel, code);
      Long userId = ((Number) result.get("usuarioId")).longValue();

      // Access token corto
      String accessToken = jwt.issue(userId, "user-" + userId, List.of("USER"));

      // Refresh token en cookie HttpOnly (usa la firma de 3 parámetros)
      sessionHelper.attachRefreshCookie(req, res, userId);

      return ResponseEntity.ok(Map.of(
          "ok", true,
          "usuarioId", userId,
          "token", accessToken,
          "telefono", result.get("telefono")));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.badRequest().body(Map.of(
          "ok", false,
          "error", e.getMessage()));
    }
  }
}