package com.barber.backend.login.controller;

import com.barber.backend.login.repository.UsuarioRepository;
import com.barber.backend.login.service.OtpService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios/telefono")
public class TelefonoController {

  private final OtpService otp;
  private final UsuarioRepository repo;

  public TelefonoController(OtpService otp, UsuarioRepository repo) {
    this.otp = otp;
    this.repo = repo;
  }

  /** Envía OTP de VINCULACIÓN (purpose=LINK) */
  @PostMapping("/enviar")
  public Map<String, Object> enviar(Authentication auth, @RequestBody Map<String, String> body) {
    if (auth == null || auth.getDetails() == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
    }
    String telefono = body.getOrDefault("telefono", "");
    otp.enviarLink(telefono);  // 👈 usa el método para LINK
    return Map.of("enviado", true);
  }

  /** Verifica OTP de VINCULACIÓN y guarda el teléfono en el usuario autenticado */
  @PostMapping("/vincular")
  @Transactional
  public Map<String, Object> vincular(Authentication auth, @RequestBody Map<String, String> body) {
    if (auth == null || auth.getDetails() == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
    }

    String telefono = body.getOrDefault("telefono", "");
    String codigo   = body.getOrDefault("codigo", "");

    // 1) Verificar OTP con propósito LINK (no crea usuario)
    var res = otp.verificarLink(telefono, codigo); // 👈 devuelve {ok, telefono}
    if (res == null || !Boolean.TRUE.equals(res.get("ok"))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP inválido o expirado");
    }

    // 2) Normalizar el teléfono de la respuesta (por si el service lo normaliza)
    String telNorm = (String) res.getOrDefault("telefono", telefono);

    // 3) Evitar duplicados: el teléfono no debe pertenecer a OTRO usuario
    Long uid = ((Number) ((Map<?, ?>) auth.getDetails()).get("uid")).longValue();
    if (repo.existsByTelefonoE164(telNorm)) {
      // si ya lo tiene el mismo usuario, devolvemos ok idempotente
      var existente = repo.findById(uid).orElseThrow();
      if (telNorm.equals(existente.getTelefonoE164())) {
        return Map.of("ok", true, "uid", uid, "telefono", telNorm, "verificado", true);
      }
      throw new ResponseStatusException(HttpStatus.CONFLICT, "El teléfono ya está usado");
    }

    // 4) Guardar en el usuario autenticado
    var u = repo.findById(uid)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    u.setTelefonoE164(telNorm);
    u.setTelefonoVerificado(true);
    repo.save(u);

    return Map.of("ok", true, "uid", uid, "telefono", telNorm, "verificado", true);
  }
}