// src/main/java/com/barber/backend/login/controller/UsuarioController.java
package com.barber.backend.login.controller;

import com.barber.backend.login.dto.UsuarioMeDTO;
import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

  private final UsuarioRepository repo;

  public UsuarioController(UsuarioRepository repo) {
    this.repo = repo;
  }

  // =======================
  // GET /api/usuarios/me
  // =======================
  @GetMapping("/me")
  public UsuarioMeDTO me(Authentication auth, HttpServletRequest req) {
    Long uid = extractUid(auth, req);
    Usuario u = repo.findById(uid)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

    List<String> roles = authoritiesToRoles(auth); // ["ADMIN","BARBERO","CLIENTE"]
    Long barberoId = extractLongFromDetails(auth, req, "barberoId").orElse(null);
    Long clienteId  = extractLongFromDetails(auth, req, "clienteId").orElse(null);

    return toDto(u, roles, barberoId, clienteId);
  }

  // =======================
  // PUT /api/usuarios/me
  // =======================
  public static final class UpdateMeRequest {
    @Size(max = 80, message = "Nombre muy largo")
    public String nombre;

    @Size(max = 80, message = "Apellido muy largo")
    public String apellido;

    @Size(max = 60, message = "Username muy largo")
    public String username;

    @Size(max = 512, message = "URL de avatar muy larga")
    public String avatarUrl;

    @Pattern(regexp = "^\\+[1-9]\\d{6,14}$", message = "Teléfono debe estar en formato E.164")
    public String telefonoE164;
  }

  @PutMapping("/me")
  public ResponseEntity<UsuarioMeDTO> updateMe(
      Authentication auth,
      HttpServletRequest req,
      @Valid @RequestBody UpdateMeRequest body
  ) {
    Long uid = extractUid(auth, req);
    Usuario u = repo.findById(uid)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

    if (body.nombre != null) {
      u.setNombre(sanitizeNombre(body.nombre));
    }
    if (notBlank(body.apellido))  u.setApellido(body.apellido.trim());
    if (notBlank(body.username))  u.setUsername(body.username.trim());
    if (notBlank(body.avatarUrl)) u.setAvatarUrl(body.avatarUrl.trim());

    if (notBlank(body.telefonoE164)) {
      String nuevoTel = body.telefonoE164.trim();
      if (!nuevoTel.equals(u.getTelefonoE164())) {
        repo.findByTelefonoE164(nuevoTel)
            .filter(existente -> !existente.getId().equals(u.getId()))
            .ifPresent(existente -> {
              throw new ResponseStatusException(
                  HttpStatus.CONFLICT,
                  "El teléfono ya está asociado a otra cuenta");
            });
        u.setTelefonoE164(nuevoTel);
        u.setTelefonoVerificado(false);
      }
    }

    u.setActualizadoEn(Instant.now());
    u = repo.save(u);

    List<String> roles = authoritiesToRoles(auth);
    Long barberoId = extractLongFromDetails(auth, req, "barberoId").orElse(null);
    Long clienteId  = extractLongFromDetails(auth, req, "clienteId").orElse(null);

    return ResponseEntity.ok(toDto(u, roles, barberoId, clienteId));
  }

  // =======================
  // Helpers
  // =======================

  /** Convierte authorities del SecurityContext en roles de negocio (sin prefijo). */
  private static List<String> authoritiesToRoles(Authentication auth) {
    return Optional.ofNullable(auth)
        .map(Authentication::getAuthorities)
        .orElseGet(List::of)
        .stream()
        .map(GrantedAuthority::getAuthority)
        .map(r -> r.startsWith("ROLE_") ? r.substring(5) : r)
        .collect(Collectors.toList());
  }

  /** Obtiene uid de Authentication.details o, en su defecto, de atributos del request. */
  private static Long extractUid(Authentication auth, HttpServletRequest req) {
    if (auth != null && auth.getDetails() instanceof Map<?, ?> details) {
      Long uid = asLong(details.get("uid"));
      if (uid != null) return uid;
    }
    Long uidAttr = asLong(req.getAttribute("uid"));
    if (uidAttr != null) return uidAttr;
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado (uid ausente)");
  }

  /** Extrae un long por clave arbitraria desde details o atributos del request. */
  private static Optional<Long> extractLongFromDetails(Authentication auth, HttpServletRequest req, String key) {
    if (auth != null && auth.getDetails() instanceof Map<?, ?> details) {
      Long v = asLong(details.get(key));
      if (v != null) return Optional.of(v);
    }
    return Optional.ofNullable(asLong(req.getAttribute(key)));
  }

  private static Long asLong(Object o) {
    if (o == null) return null;
    if (o instanceof Number n) return n.longValue();
    if (o instanceof String s) {
      try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
    }
    return null;
  }

  private static String nz(String s) {
    if (s == null) return "";
    String trimmed = s.trim();
    if (trimmed.isEmpty()) return "";
    if ("usuario".equalsIgnoreCase(trimmed)) return "";
    return trimmed;
  }

  private static String sanitizeNombre(String nombre) {
    if (nombre == null) return null;
    String trimmed = nombre.trim();
    if (trimmed.isEmpty()) return null;
    if ("usuario".equalsIgnoreCase(trimmed)) return null;
    return trimmed;
  }

  private static boolean notBlank(String s) {
    return s != null && !s.isBlank();
  }

  private static UsuarioMeDTO toDto(Usuario u, List<String> roles, Long barberoId, Long clienteId) {
    String proveedorStr = (u.getProveedor() != null) ? u.getProveedor().name() : null;
    return new UsuarioMeDTO(
        u.getId(),
        nz(u.getNombre()),
        nz(u.getApellido()),
        u.getEmail(),
        u.getUsername(),
        u.getTelefonoE164(),
        u.isTelefonoVerificado(),
        proveedorStr,
        u.getProveedorId(),
        u.getAvatarUrl(),
        roles != null ? roles : List.of(),
        barberoId,
        clienteId
    );
  }
}