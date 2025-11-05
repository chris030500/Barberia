// src/main/java/com/barber/backend/agenda/controller/BarberoBloqueoController.java
package com.barber.backend.agenda.controller;

import com.barber.backend.agenda.dto.BarberoBloqueoDTO;
import com.barber.backend.agenda.dto.BarberoBloqueoSaveRequest;
import com.barber.backend.agenda.service.BarberoBloqueoService;
import com.barber.backend.agenda.config.AgendaProperties;
import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/barberos/{barberoId}/bloqueos")
public class BarberoBloqueoController {

  private final BarberoBloqueoService svc;
  private final UsuarioRepository usuarioRepo;
  private final AgendaProperties props;

  private static final DateTimeFormatter YYYY_MM_DD = DateTimeFormatter.ISO_LOCAL_DATE;

  public BarberoBloqueoController(BarberoBloqueoService svc,
                                  UsuarioRepository usuarioRepo,
                                  AgendaProperties props) {
    this.svc = svc;
    this.usuarioRepo = usuarioRepo;
    this.props = props;
  }

  @GetMapping
  public List<BarberoBloqueoDTO> list(@PathVariable Long barberoId,
                                      @RequestParam(required = false) Instant desde,
                                      @RequestParam(required = false) Instant hasta,
                                      @RequestParam(required = false) String fecha,
                                      Authentication auth,
                                      HttpServletRequest req) {
    enforceAccess(barberoId, auth, req, false);

    // Resolver ventana temporal
    if (desde == null || hasta == null) {
      ZoneId tz = ZoneId.of(props.getTimezone().trim());
      LocalDate ld = (fecha != null && !fecha.isBlank())
          ? LocalDate.parse(fecha, YYYY_MM_DD)
          : LocalDate.now(tz);

      Instant start = ld.atStartOfDay(tz).toInstant();
      Instant end   = ld.plusDays(1).atStartOfDay(tz).toInstant(); // [start, end)
      desde = start;
      hasta = end;
    }

    return svc.list(barberoId, desde, hasta);
  }

  @PostMapping
  public BarberoBloqueoDTO create(@PathVariable Long barberoId,
                                  @Valid @RequestBody BarberoBloqueoSaveRequest body,
                                  Authentication auth,
                                  HttpServletRequest req) {
    enforceAccess(barberoId, auth, req, true);
    return svc.create(barberoId, body);
  }

  @PutMapping("/{bloqueoId}")
  public BarberoBloqueoDTO update(@PathVariable Long barberoId,
                                  @PathVariable Long bloqueoId,
                                  @Valid @RequestBody BarberoBloqueoSaveRequest body,
                                  Authentication auth,
                                  HttpServletRequest req) {
    enforceAccess(barberoId, auth, req, true);
    return svc.update(barberoId, bloqueoId, body);
  }

  @DeleteMapping("/{bloqueoId}")
  public void delete(@PathVariable Long barberoId,
                     @PathVariable Long bloqueoId,
                     Authentication auth,
                     HttpServletRequest req) {
    enforceAccess(barberoId, auth, req, true);
    svc.delete(barberoId, bloqueoId);
  }

  // ===== seguridad contextual (igual que horario) =====
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