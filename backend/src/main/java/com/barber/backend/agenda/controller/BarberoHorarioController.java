// src/main/java/com/barber/backend/agenda/controller/BarberoHorarioController.java
package com.barber.backend.agenda.controller;

import com.barber.backend.agenda.dto.BarberoHorarioDTO;
import com.barber.backend.agenda.service.BarberoHorarioService;
import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/barberos/{barberoId}/horario-semanal")
public class BarberoHorarioController {

  private final BarberoHorarioService svc;
  private final UsuarioRepository usuarioRepo;

  public BarberoHorarioController(BarberoHorarioService svc, UsuarioRepository usuarioRepo) {
    this.svc = svc;
    this.usuarioRepo = usuarioRepo;
  }

  @GetMapping
  public List<BarberoHorarioDTO> get(@PathVariable Long barberoId,
                                     Authentication auth,
                                     HttpServletRequest req) {
    enforceAccess(barberoId, auth, req, false);
    return svc.getHorario(barberoId);
  }

  @PutMapping
  public List<BarberoHorarioDTO> put(@PathVariable Long barberoId,
                                     @RequestBody List<BarberoHorarioDTO> body,
                                     Authentication auth,
                                     HttpServletRequest req) {
    enforceAccess(barberoId, auth, req, true);
    return svc.replaceHorario(barberoId, body);
  }

  // ===== helpers =====
  private void enforceAccess(Long pathBarberoId, Authentication auth, HttpServletRequest req, boolean write) {
    if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
    boolean isAdmin   = hasRole(auth, "ROLE_ADMIN");
    boolean isBarbero = hasRole(auth, "ROLE_BARBERO");

    if (isAdmin) return;

    if (isBarbero) {
      Long uid = extractUid(auth, req);
      Usuario u = usuarioRepo.findById(uid)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
      Long ownBarberoId = (u.getBarbero() != null) ? u.getBarbero().getId() : null;
      if (ownBarberoId == null || !ownBarberoId.equals(pathBarberoId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado para este barbero");
      }
      return;
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
  }

  private static boolean hasRole(Authentication auth, String role) {
    return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(role::equals);
  }

  @SuppressWarnings("unchecked")
  private static Long extractUid(Authentication auth, HttpServletRequest req) {
    if (auth.getDetails() instanceof java.util.Map<?, ?> details) {
      Object v = details.get("uid");
      if (v instanceof Number n) return n.longValue();
      if (v instanceof String s) { try { return Long.parseLong(s); } catch (NumberFormatException ignored) {} }
    }
    Object attr = req.getAttribute("uid");
    if (attr instanceof Number n) return n.longValue();
    if (attr instanceof String s) { try { return Long.parseLong(s); } catch (NumberFormatException ignored) {} }
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "uid ausente");
  }
}