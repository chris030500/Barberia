// src/main/java/com/barber/backend/login/dto/UsuarioMeDTO.java
package com.barber.backend.login.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class UsuarioMeDTO {
  private Long id;
  private String nombre;
  private String apellido;
  private String email;
  private String username;
  private String telefonoE164;
  private boolean telefonoVerificado;
  private String proveedor;   // nombre del enum Proveedor como String
  private String proveedorId;
  private String avatarUrl;

  // Nuevos campos
  private List<String> roles;  // ADMIN, BARBERO, CLIENTE...
  private Long barberoId;
  private Long clienteId;

  public UsuarioMeDTO() {
    // por defecto evita nulls
    this.roles = new ArrayList<>();
  }

  /**
   * Constructor "legacy" (compatibilidad con código existente).
   * NO incluye roles / barberoId / clienteId.
   */
  public UsuarioMeDTO(
      Long id,
      String nombre,
      String apellido,
      String email,
      String username,
      String telefonoE164,
      boolean telefonoVerificado,
      String proveedor,
      String proveedorId,
      String avatarUrl
  ) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.username = username;
    this.telefonoE164 = telefonoE164;
    this.telefonoVerificado = telefonoVerificado;
    this.proveedor = proveedor;
    this.proveedorId = proveedorId;
    this.avatarUrl = avatarUrl;
    this.roles = new ArrayList<>();
    this.barberoId = null;
    this.clienteId = null;
  }

  /**
   * Constructor COMPLETO (el que usa el UsuarioController nuevo).
   */
  public UsuarioMeDTO(
      Long id,
      String nombre,
      String apellido,
      String email,
      String username,
      String telefonoE164,
      boolean telefonoVerificado,
      String proveedor,
      String proveedorId,
      String avatarUrl,
      List<String> roles,
      Long barberoId,
      Long clienteId
  ) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.username = username;
    this.telefonoE164 = telefonoE164;
    this.telefonoVerificado = telefonoVerificado;
    this.proveedor = proveedor;
    this.proveedorId = proveedorId;
    this.avatarUrl = avatarUrl;
    // evita NPE
    this.roles = (roles == null) ? new ArrayList<>() : new ArrayList<>(roles);
    this.barberoId = barberoId;
    this.clienteId = clienteId;
  }

  // ========================
  // Getters y Setters
  // ========================

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }

  public String getApellido() { return apellido; }
  public void setApellido(String apellido) { this.apellido = apellido; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }

  public String getTelefonoE164() { return telefonoE164; }
  public void setTelefonoE164(String telefonoE164) { this.telefonoE164 = telefonoE164; }

  public boolean isTelefonoVerificado() { return telefonoVerificado; }
  public void setTelefonoVerificado(boolean telefonoVerificado) { this.telefonoVerificado = telefonoVerificado; }

  public String getProveedor() { return proveedor; }
  public void setProveedor(String proveedor) { this.proveedor = proveedor; }

  public String getProveedorId() { return proveedorId; }
  public void setProveedorId(String proveedorId) { this.proveedorId = proveedorId; }

  public String getAvatarUrl() { return avatarUrl; }
  public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

  public List<String> getRoles() { return roles; }
  public void setRoles(List<String> roles) {
    this.roles = (roles == null) ? new ArrayList<>() : new ArrayList<>(roles);
  }

  public Long getBarberoId() { return barberoId; }
  public void setBarberoId(Long barberoId) { this.barberoId = barberoId; }

  public Long getClienteId() { return clienteId; }
  public void setClienteId(Long clienteId) { this.clienteId = clienteId; }

  // opcional: equals/hashCode/toString
  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof UsuarioMeDTO that)) return false;
    return Objects.equals(id, that.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }

  @Override
  public String toString() {
    return "UsuarioMeDTO{id=" + id + ", username='" + username + "'}";
  }
}