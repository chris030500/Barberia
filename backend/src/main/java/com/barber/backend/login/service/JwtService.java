package com.barber.backend.login.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class JwtService {
  private final byte[] secret;
  private final long expMin;

  public JwtService(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.exp-min:60}") long expMin) {
    this.secret = secret.getBytes(StandardCharsets.UTF_8);
    this.expMin = expMin;
  }

  public String issue(Long userId, String subject, List<String> roles) {
    Instant now = Instant.now();
    return Jwts.builder()
        .setSubject(subject == null ? String.valueOf(userId) : subject)
        .addClaims(Map.of("uid", userId, "roles", roles))
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(now.plusSeconds(expMin * 60)))
        .signWith(Keys.hmacShaKeyFor(secret))
        .compact();
  }

  public Map<String, Object> parse(String token) {
    var claims = Jwts.parserBuilder().setSigningKey(Keys.hmacShaKeyFor(secret)).build()
        .parseClaimsJws(token).getBody();
    return Map.of(
        "sub", claims.getSubject(),
        "uid", claims.get("uid"),
        "roles", claims.get("roles")
    );
  }
}

