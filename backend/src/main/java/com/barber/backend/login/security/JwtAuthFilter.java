// src/main/java/com/barber/backend/login/security/JwtAuthFilter.java
package com.barber.backend.login.security;

import com.barber.backend.login.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
  private final JwtService jwt;

  public JwtAuthFilter(JwtService jwt) {
    this.jwt = jwt;
  }

  @Override
  protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
    String p = request.getRequestURI();
    // Rutas públicas y preflight CORS
    return HttpMethod.OPTIONS.matches(request.getMethod())
        || p.startsWith("/auth")
        || p.startsWith("/actuator")
        || p.startsWith("/oauth2")
        || p.startsWith("/login");
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest req,
      @NonNull HttpServletResponse res,
      @NonNull FilterChain chain
  ) throws ServletException, IOException {

    String header = req.getHeader(HttpHeaders.AUTHORIZATION);

    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      try {
        Map<String, Object> claims = jwt.parse(token);

        String sub = (String) claims.get("sub"); // username o email
        Long uid = toLong(claims.get("uid"));
        Long barberoId = toLong(claims.get("barberoId"));
        Long clienteId = toLong(claims.get("clienteId"));

        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) claims.getOrDefault("roles", List.of("USER"));

        var authorities = roles.stream()
            .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());

        // Principal tipado con ids y roles
        var principal = new AppUserPrincipal(sub, uid, barberoId, clienteId, roles);

        var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);

        // Por si quieres leerlos en filtros/controladores sin @AuthenticationPrincipal
        req.setAttribute("claims", claims);
        if (uid != null) req.setAttribute("uid", uid);
        if (barberoId != null) req.setAttribute("barberoId", barberoId);
        if (clienteId != null) req.setAttribute("clienteId", clienteId);

        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (Exception e) {
        log.warn("JWT inválido: {}", e.getMessage());
        SecurityContextHolder.clearContext();
      }
    }

    chain.doFilter(req, res);
  }

  private Long toLong(Object v) {
    if (v == null) return null;
    if (v instanceof Number n) return n.longValue();
    if (v instanceof String s) {
      try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
    }
    return null;
  }
}