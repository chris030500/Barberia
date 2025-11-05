// src/main/java/com/barber/backend/login/security/AppUserPrincipal.java
package com.barber.backend.login.security;

import java.util.List;

public class AppUserPrincipal {
  private final String username;      // sub
  private final Long userId;          // uid (si lo tienes)
  private final Long barberoId;       // si aplica
  private final Long clienteId;       // si aplica
  private final List<String> roles;   // roles sin prefijo

  public AppUserPrincipal(String username, Long userId, Long barberoId, Long clienteId, List<String> roles) {
    this.username = username;
    this.userId = userId;
    this.barberoId = barberoId;
    this.clienteId = clienteId;
    this.roles = roles;
  }

  public String getUsername() { return username; }
  public Long getUserId() { return userId; }
  public Long getBarberoId() { return barberoId; }
  public Long getClienteId() { return clienteId; }
  public List<String> getRoles() { return roles; }

  public boolean hasRole(String role) {
    if (role == null) return false;
    var r = role.startsWith("ROLE_") ? role.substring(5) : role;
    return roles.stream().anyMatch(x -> x.equalsIgnoreCase(r));
  }
}
