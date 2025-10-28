package com.barber.backend.login.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Service
public class RefreshTokenService {

  private final SecretKey key;
  private final long ttlSeconds; // ej. 30 días

  public RefreshTokenService(
      @Value("${jwt.refresh.secret}") String secretBase64,
      @Value("${jwt.refresh.ttl-seconds:2592000}") long ttlSeconds
  ) {
    this.ttlSeconds = ttlSeconds;
    this.key = initKey(secretBase64);
  }

  private SecretKey initKey(String secretBase64) {
    byte[] secretBytes;
    try {
      secretBytes = Base64.getDecoder().decode(secretBase64);
    } catch (IllegalArgumentException ex) {
      // Si no es base64, usa el texto crudo
      secretBytes = secretBase64.getBytes(StandardCharsets.UTF_8);
    }
    return Keys.hmacShaKeyFor(secretBytes);
  }

  /** Emite un refresh token válido por N segundos */
  public String issue(Long userId) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(ttlSeconds);
    String jti = UUID.randomUUID().toString();

    return Jwts.builder()
        .setSubject("refresh-user-" + userId)
        .setId(jti)
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(exp))
        .claim("uid", userId)
        .signWith(key, SignatureAlgorithm.HS256) // 👈 0.11.5 exige algoritmo explícito
        .compact();
  }

  /** Valida firma/exp y devuelve el UID */
  public Long verifyAndGetUid(String token) {
    Jws<Claims> jws = Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token);

    Claims claims = jws.getBody();
    String sub = claims.getSubject();

    if (sub == null || !sub.startsWith("refresh-user-")) {
      throw new IllegalArgumentException("Refresh token inválido (subject).");
    }

    Number uid = claims.get("uid", Number.class);
    if (uid == null) {
      throw new IllegalArgumentException("Refresh token inválido (uid).");
    }

    return uid.longValue();
  }
}
