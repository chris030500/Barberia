package com.barber.backend.login.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class JwtService {
  private final SecretKey key;
  private final long expMin;   // expiración por defecto (minutos)
  private final String issuer;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.exp-min:60}") long expMin,
      @Value("${app.jwt.issuer:barber-backend}") String issuer
  ) {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      throw new IllegalArgumentException("app.jwt.secret debe tener al menos 32 bytes (256 bits) para HS256.");
    }
    this.key = Keys.hmacShaKeyFor(bytes);
    this.expMin = expMin;
    this.issuer = issuer;
  }

  // ========= EMISIÓN =========

  /** Mantiene compatibilidad: emite usando expiración por defecto y sin extra claims. */
  public String issue(Long userId, String subject, List<String> roles) {
    return issue(userId, subject, roles, Collections.emptyMap(), this.expMin);
  }

  /** Emite usando expiración por defecto y con extra claims. */
  public String issue(Long userId, String subject, List<String> roles, Map<String, Object> extraClaims) {
    return issue(userId, subject, roles, extraClaims, this.expMin);
  }

  /** Emite con extra claims y expiración custom (en minutos). */
  public String issue(Long userId,
                      String subject,
                      List<String> roles,
                      Map<String, Object> extraClaims,
                      long expMinutes) {
    if (userId == null) throw new IllegalArgumentException("userId requerido");
    Instant now = Instant.now();

    // Asegura roles no nulos
    List<String> safeRoles = (roles == null) ? List.of() : roles;

    JwtBuilder builder = Jwts.builder()
        .setIssuer(issuer)
        .setSubject(subject == null ? String.valueOf(userId) : subject)
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(now.plusSeconds(Math.max(1, expMinutes) * 60)))
        .claim("uid", userId)
        .claim("roles", safeRoles);

    // Mezcla extra claims (siempre que no pisen estándar)
    if (extraClaims != null && !extraClaims.isEmpty()) {
      for (Map.Entry<String, Object> e : extraClaims.entrySet()) {
        String k = e.getKey();
        if (k == null) continue;
        // Evita sobrescribir claves estándar
        if (Set.of("iss","sub","iat","exp","uid","roles").contains(k)) continue;
        Object v = e.getValue();
        builder.claim(k, v);
      }
    }

    builder.signWith(key, SignatureAlgorithm.HS256);
    return builder.compact();
  }

  // ========= PARSEO =========

  /**
   * Parsea el JWT y devuelve TODOS los claims en un Map, incluyendo:
   * - estándar: iss, sub, iat (Date), exp (Date)
   * - custom: uid, roles, barberoId, etc.
   */
  public Map<String, Object> parse(String token) {
    JwtParser parser = Jwts.parserBuilder()
        .setSigningKey(key)
        .setAllowedClockSkewSeconds(60) // leeway opcional
        .requireIssuer(issuer)
        .build();

    Claims claims = parser.parseClaimsJws(token).getBody();

    Map<String, Object> out = new HashMap<>();
    // Copia todos los claims custom/estándar presentes
    for (Map.Entry<String, Object> e : claims.entrySet()) {
      out.put(e.getKey(), e.getValue());
    }
    // Garantiza presencia de los estándar con nombres claros
    out.put("iss", claims.getIssuer());
    out.put("sub", claims.getSubject());
    out.put("iat", claims.getIssuedAt());
    out.put("exp", claims.getExpiration());
    return out;
  }

  // ========= GETTERS =========

  public long getDefaultExpMin() { return expMin; }
  public String getIssuer() { return issuer; }
}