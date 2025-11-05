// src/main/java/com/barber/backend/login/controller/FirebaseAuthController.java
package com.barber.backend.login.controller;

import com.barber.backend.login.dto.UsuarioMeDTO;
import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.model.Usuario.Proveedor;
import com.barber.backend.login.repository.UsuarioRepository;
import com.barber.backend.login.service.JwtService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/auth/firebase")
@Validated
public class FirebaseAuthController {

  private static final Logger log = LoggerFactory.getLogger(FirebaseAuthController.class);

  private final UsuarioRepository usuarioRepo;
  private final JwtService jwtService;

  public FirebaseAuthController(UsuarioRepository usuarioRepo, JwtService jwtService) {
    this.usuarioRepo = usuarioRepo;
    this.jwtService = jwtService;
  }

  // ==== DTOs ====
  public static final class ExchangeRequest {
    @NotBlank
    public String idToken;
    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
  }

  public static final class ExchangeResponse {
    public boolean ok;
    public String accessToken;
    public UsuarioMeDTO user;
    public ExchangeResponse(boolean ok, String accessToken, UsuarioMeDTO user) {
      this.ok = ok;
      this.accessToken = accessToken;
      this.user = user;
    }
  }

  @PostMapping("/exchange")
  public ResponseEntity<?> exchange(@Valid @RequestBody ExchangeRequest req) throws Exception {
    // 1) Verificar token de Firebase
    FirebaseToken token = FirebaseAuth.getInstance().verifyIdToken(req.idToken, false);

    String uid = token.getUid();
    String email = token.getEmail();
    String name  = token.getName();
    String phone = safeStr(token.getClaims().get("phone_number")); // a veces viene en claims
    String provider = extractSignInProvider(token.getClaims());

    log.info("Firebase uid={}, email={}, name={}, provider={}, phone={}", uid, email, name, provider, phone);

    // 2) Buscar o crear usuario
    Usuario u = usuarioRepo.findByFirebaseUid(uid).orElseGet(() -> {
      Usuario nu = new Usuario();
      nu.setActivo(true);
      nu.setCreadoEn(Instant.now());
      return nu;
    });

    // 3) Mapear/actualizar datos básicos
    u.setFirebaseUid(uid);
    u.setEmail(nullIfBlank(email));
    u.setNombre(nullIfBlank(name));
    if (isBlank(u.getNombre()))   u.setNombre("Usuario");
    if (u.getApellido() == null)  u.setApellido(""); // evita NOT NULL si tu esquema lo requiere

    if (isBlank(u.getUsername())) {
      u.setUsername(suggestUsername(email, phone, uid));
    }

    u.setProveedor(resolveProveedor(provider));
    u.setProveedorId(uid);

    if (!isBlank(phone)) {
      u.setTelefonoE164(phone);
      u.setTelefonoVerificado(true);
    }

    u.setActualizadoEn(Instant.now());
    u = usuarioRepo.save(u);

    // 4) Resolver roles e ids
    List<String> roles = resolveRolesFor(u); // ["ADMIN"] | ["BARBERO"] | ["CLIENTE"] ...
    Long barberoId = resolveBarberoIdFor(u);
    Long clienteId  = resolveClienteIdFor(u);

    // 5) Emitir JWT con uid + roles (JwtAuthFilter convertirá a ROLE_* en authorities)
    String subject = (!isBlank(u.getUsername())) ? u.getUsername() : String.valueOf(u.getId());
    String accessToken = jwtService.issue(u.getId(), subject, roles);

    // 5.1) Set-Cookie httpOnly
    ResponseCookie cookie = ResponseCookie.from("access", accessToken)
        .httpOnly(true)
        .secure(true)  // en dev sin https -> false; en prod -> true
        .sameSite("Lax")
        .path("/")
        .maxAge(Duration.ofMinutes(60))
        .build();

    // 6) DTO para el frontend (roles sin prefijo)
    UsuarioMeDTO dto = new UsuarioMeDTO(
        u.getId(),
        defaultIfBlank(u.getNombre(), ""),
        defaultIfBlank(u.getApellido(), ""),
        nullIfBlank(u.getEmail()),
        defaultIfBlank(u.getUsername(), ""),
        nullIfBlank(u.getTelefonoE164()),
        u.isTelefonoVerificado(),
        u.getProveedor() != null ? u.getProveedor().name() : null,
        nullIfBlank(u.getProveedorId()),
        nullIfBlank(u.getAvatarUrl()),
        stripRolePrefix(roles), // ["ADMIN","BARBERO","CLIENTE"]
        barberoId,
        clienteId
    );

    ExchangeResponse resp = new ExchangeResponse(true, accessToken, dto);
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, cookie.toString())
        .body(resp);
  }

  // ==== Helpers ====

  private static String extractSignInProvider(Map<String, Object> claims) {
    try {
      Object firebase = claims.get("firebase");
      if (firebase instanceof Map<?, ?> fm) {
        Object sip = fm.get("sign_in_provider");
        return safeStr(sip);
      }
    } catch (Exception ignored) {}
    return null;
  }

  private static Proveedor resolveProveedor(String provider) {
    if (provider == null) return Proveedor.FIREBASE;
    return switch (provider) {
      case "phone"        -> Proveedor.PHONE;
      case "google.com"   -> Proveedor.GOOGLE;
      case "facebook.com" -> Proveedor.FACEBOOK;
      case "password"     -> Proveedor.LOCAL;
      default             -> Proveedor.FIREBASE;
    };
  }

  /** Devuelve roles de negocio (sin prefijo), según tu modelo `Usuario`. */
  private static List<String> resolveRolesFor(Usuario u) {
    List<String> out = new ArrayList<>();
    if (u.getRol() != null) {
      switch (u.getRol()) {
        case ADMIN   -> out.add("ADMIN");
        case BARBERO -> out.add("BARBERO");
        case CLIENTE -> out.add("CLIENTE");
      }
    }
    // Si existe relación con Barbero, asegura rol BARBERO
    if (u.getBarbero() != null && out.stream().noneMatch(r -> r.equals("BARBERO"))) {
      out.add("BARBERO");
    }
    // Fallback para no dejarlo sin rol
    if (out.isEmpty()) out.add("CLIENTE");
    return out;
  }

  private static Long resolveBarberoIdFor(Usuario u) {
    return (u.getBarbero() != null) ? u.getBarbero().getId() : null;
  }

  private static Long resolveClienteIdFor(Usuario u) {
    // Si después agregas entidad Cliente relacionada, regrésala aquí
    return null;
  }

  /** Si vinieran ya con ROLE_, los deja sin prefijo; aquí ya usamos sin prefijo, pero es seguro. */
  private static List<String> stripRolePrefix(List<String> roles) {
    if (roles == null) return List.of();
    List<String> res = new ArrayList<>(roles.size());
    for (String r : roles) {
      if (r == null) continue;
      res.add(r.startsWith("ROLE_") ? r.substring(5) : r);
    }
    return res;
  }

  private static boolean isBlank(String s) { return s == null || s.isBlank(); }
  private static String nullIfBlank(String s) { return isBlank(s) ? null : s; }
  private static String defaultIfBlank(String s, String def) { return isBlank(s) ? def : s; }
  private static String safeStr(Object o) { return o == null ? null : String.valueOf(o); }

  private static String suggestUsername(String email, String phone, String uid) {
    if (!isBlank(email)) {
      String left = email.split("@")[0];
      return left.toLowerCase(Locale.ROOT);
    }
    if (!isBlank(phone)) {
      return "user" + phone.replace("+", "").replaceAll("\\D", "");
    }
    return "user-" + (uid.length() > 6 ? uid.substring(0, 6) : uid);
  }
}