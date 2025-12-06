package com.barber.backend.login.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

import com.barber.backend.login.model.RefreshToken;
import com.barber.backend.login.repository.RefreshTokenRepository;

@Service
public class RefreshTokenService {

  private final SecretKey key;
  private final long ttlSeconds; // ej. 30 días
  private final RefreshTokenRepository repo;

  public RefreshTokenService(
      @Value("${jwt.refresh.secret}") String secretBase64,
      @Value("${jwt.refresh.ttl-seconds:2592000}") long ttlSeconds,
      RefreshTokenRepository repo
  ) {
    this.ttlSeconds = ttlSeconds;
    this.key = initKey(secretBase64);
    this.repo = repo;
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

  public String issue(Long userId) {
    return issue(userId, null, null);
  }

  /** Emite un refresh token válido por N segundos y rota los anteriores del usuario */
  @Transactional
  public String issue(Long userId, String userAgent, String ip) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(ttlSeconds);
    String jti = UUID.randomUUID().toString();

    String rawToken = Jwts.builder()
        .setSubject("refresh-user-" + userId)
        .setId(jti)
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(exp))
        .claim("uid", userId)
        .signWith(key, SignatureAlgorithm.HS256) // 👈 0.11.5 exige algoritmo explícito
        .compact();

    repo.deleteByUsuarioId(userId);

    RefreshToken entity = new RefreshToken();
    entity.setUsuarioId(userId);
    entity.setJti(jti);
    entity.setTokenHash(sha256(rawToken));
    entity.setExpiraEn(LocalDateTime.ofInstant(exp, ZoneOffset.UTC));
    entity.setUserAgent(userAgent);
    entity.setIp(ip);
    repo.save(entity);

    return rawToken;
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

    String jti = claims.getId();
    RefreshToken stored = repo.findByJti(jti)
        .orElseThrow(() -> new IllegalArgumentException("Refresh token revocado o inexistente."));

    if (stored.isRevocado() || stored.getExpiraEn().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
      throw new IllegalArgumentException("Refresh token expirado o revocado.");
    }

    if (!sha256(token).equals(stored.getTokenHash())) {
      throw new IllegalArgumentException("Refresh token no coincide con el registrado.");
    }

    if (!stored.getUsuarioId().equals(uid.longValue())) {
      throw new IllegalArgumentException("Refresh token inválido (uid desalineado).");
    }

    return uid.longValue();
  }

  @Transactional
  public void revoke(String rawToken) {
    try {
      Claims claims = Jwts.parserBuilder()
          .setSigningKey(key)
          .build()
          .parseClaimsJws(rawToken)
          .getBody();
      repo.revokeByJti(claims.getId());
    } catch (Exception ignored) {
      // Si falla la verificación del token lo ignoramos: ya no es válido para uso futuro
    }
  }

  private String sha256(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hashed = digest.digest(token.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 no disponible", e);
    }
  }
}
