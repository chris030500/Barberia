package com.barber.backend.agenda.controller;

import com.barber.backend.agenda.dto.BarberoDisponibilidadResumenDTO;
import com.barber.backend.agenda.service.BarberoDisponibilidadFacade;
import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/barberos/{barberoId}/disponibilidad")
public class BarberoDisponibilidadController {

  private final BarberoDisponibilidadFacade facade;
  private final UsuarioRepository usuarioRepository;

  public BarberoDisponibilidadController(BarberoDisponibilidadFacade facade,
                                         UsuarioRepository usuarioRepository) {
    this.facade = facade;
    this.usuarioRepository = usuarioRepository;
  }

  @GetMapping("/resumen")
  public BarberoDisponibilidadResumenDTO resumen(@PathVariable Long barberoId,
                                                 Authentication auth,
                                                 HttpServletRequest request) {
    enforceAccess(barberoId, auth, request);
    return facade.resumen(barberoId);
  }

  private void enforceAccess(Long pathBarberoId, Authentication auth, HttpServletRequest request) {
    if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
    boolean isAdmin = hasRole(auth, "ROLE_ADMIN");
    boolean isBarbero = hasRole(auth, "ROLE_BARBERO");

    if (isAdmin) return;

    if (isBarbero) {
      Long uid = extractUid(auth, request);
      Usuario usuario = usuarioRepository.findById(uid)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
      Long ownBarberoId = usuario.getBarbero() != null ? usuario.getBarbero().getId() : null;
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

  private static Long extractUid(Authentication auth, HttpServletRequest request) {
    if (auth.getDetails() instanceof java.util.Map<?, ?> details) {
      Object v = details.get("uid");
      if (v instanceof Number number) return number.longValue();
      if (v instanceof String s) {
        try {
          return Long.parseLong(s);
        } catch (NumberFormatException ignored) {
        }
      }
    }
    Object attr = request.getAttribute("uid");
    if (attr instanceof Number number) return number.longValue();
    if (attr instanceof String s) {
      try {
        return Long.parseLong(s);
      } catch (NumberFormatException ignored) {
      }
    }
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "uid ausente");
  }
}
