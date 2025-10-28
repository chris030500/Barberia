package com.barber.backend.login.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.barber.backend.login.service.JwtService;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JwtAuthFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

  private final JwtService jwt;

  public JwtAuthFilter(JwtService jwt) { this.jwt = jwt; }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String p = request.getRequestURI();
    // No filtrar auth ni actuator; SÍ filtra /api/**
    return p.startsWith("/auth") || p.startsWith("/actuator");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String header = req.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null && header.startsWith("Bearer ")) {
      try {
        var data = jwt.parse(header.substring(7));
        @SuppressWarnings("unchecked")
        var roles = (List<String>) data.getOrDefault("roles", List.of("USER"));

        var auth = new UsernamePasswordAuthenticationToken(
            data.get("sub"), null,
            roles.stream()
                .map(r -> new SimpleGrantedAuthority(r.startsWith("ROLE_") ? r : "ROLE_" + r))
                .collect(Collectors.toList())
        );

        // 👉 Para poder leer uid/roles en el controller:
        auth.setDetails(data);

        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (Exception e) {
        log.warn("JWT inválido: {}", e.getMessage()); // ver causa exacta (firma, exp, etc.)
      }
    }
    chain.doFilter(req, res);
  }
}
