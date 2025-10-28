package com.barber.backend.login.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
public class Usuario {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String nombre;
  private String apellido;

  @Column(unique = true)
  private String email;
  @Column(unique = true)
  private String username;

  @Column(name = "password_hash", nullable = true)
  private String passwordHash;

  @Column(name = "telefono_e164", unique = true)
  private String telefonoE164;

  @Column(name = "telefono_verificado", nullable = false)
  private boolean telefonoVerificado = false;

  // en Usuario.java
  @Column(name = "proveedor_id")
  private String proveedorId;

  @Column(name = "avatar_url")
  private String avatarUrl;

  // getters/setters...

  @Enumerated(EnumType.STRING)
  private Proveedor proveedor = Proveedor.LOCAL;

  private LocalDateTime creadoEn;
  private LocalDateTime actualizadoEn;

  @PrePersist
  void onCreate() {
    creadoEn = actualizadoEn = LocalDateTime.now();
  }

  @PreUpdate
  void onUpdate() {
    actualizadoEn = LocalDateTime.now();
  }

  public enum Proveedor {
    LOCAL, GOOGLE, FACEBOOK
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getNombre() {
    return nombre;
  }

  public void setNombre(String nombre) {
    this.nombre = nombre;
  }

  public String getApellido() {
    return apellido;
  }

  public void setApellido(String apellido) {
    this.apellido = apellido;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public String getTelefonoE164() {
    return telefonoE164;
  }

  public void setTelefonoE164(String telefonoE164) {
    this.telefonoE164 = telefonoE164;
  }

  public boolean isTelefonoVerificado() {
    return telefonoVerificado;
  }

  public void setTelefonoVerificado(boolean telefonoVerificado) {
    this.telefonoVerificado = telefonoVerificado;
  }

  public Proveedor getProveedor() {
    return proveedor;
  }

  public void setProveedor(Proveedor proveedor) {
    this.proveedor = proveedor;
  }

  public LocalDateTime getCreadoEn() {
    return creadoEn;
  }

  public void setCreadoEn(LocalDateTime creadoEn) {
    this.creadoEn = creadoEn;
  }

  public LocalDateTime getActualizadoEn() {
    return actualizadoEn;
  }

  public void setActualizadoEn(LocalDateTime actualizadoEn) {
    this.actualizadoEn = actualizadoEn;
  }

  public String getProveedorId() {
    return proveedorId;
  }

  public void setProveedorId(String proveedorId) {
    this.proveedorId = proveedorId;
  }

  public String getAvatarUrl() {
    return avatarUrl;
  }

  public void setAvatarUrl(String avatarUrl) {
    this.avatarUrl = avatarUrl;
  }

}
