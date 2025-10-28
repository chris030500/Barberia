// src/main/java/com/barber/backend/login/controller/UsuarioController.java
package com.barber.backend.login.controller;

import com.barber.backend.login.dto.UsuarioMeDTO;
import com.barber.backend.login.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
  private final UsuarioRepository repo;

  public UsuarioController(UsuarioRepository repo) { this.repo = repo; }

  @GetMapping("/me")
  public UsuarioMeDTO me(Authentication auth) {
    if (auth == null || auth.getDetails() == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
    }
    @SuppressWarnings("unchecked")
    var details = (Map<String,Object>) auth.getDetails();
    Long uid = ((Number) details.get("uid")).longValue();

    var u = repo.findById(uid)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

    return new UsuarioMeDTO(
        u.getId(),
        u.getNombre(),
        u.getApellido(),
        u.getEmail(),
        u.getUsername(),
        u.getTelefonoE164(),
        u.isTelefonoVerificado(),
        u.getProveedor().name(),
        u.getProveedorId(),
        u.getAvatarUrl()
    );
  }
}
