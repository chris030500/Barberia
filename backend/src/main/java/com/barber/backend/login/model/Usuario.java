// src/main/java/com/barber/backend/login/model/Usuario.java
package com.barber.backend.login.model;

import com.barber.backend.barberos.model.Barbero;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "usuarios",
    indexes = {
        @Index(name = "idx_usuarios_email", columnList = "email"),
        @Index(name = "idx_usuarios_username", columnList = "username"),
        @Index(name = "idx_usuarios_firebase_uid", columnList = "firebase_uid"),
        @Index(name = "idx_usuarios_rol", columnList = "rol")
    }
)
public class Usuario {

  // ===== Campos base =====
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(length = 100)
  private String nombre;

  @Column(length = 100)
  private String apellido;

  @Column(unique = true, length = 150)
  private String email;

  @Column(unique = true, length = 60)
  private String username;

  @Column(name = "password_hash", length = 255)
  private String passwordHash;

  @Column(name = "telefono_e164", unique = true, length = 20)
  private String telefonoE164;

  @Column(name = "telefono_verificado", nullable = false)
  private boolean telefonoVerificado = false;

  @Enumerated(EnumType.STRING)
  @Column(length = 20, nullable = false)
  private Proveedor proveedor = Proveedor.LOCAL;

  /** uid del proveedor (p.ej. Firebase UID) */
  @Column(name = "proveedor_id", length = 191)
  private String proveedorId;

  @Column(name = "avatar_url", length = 255)
  private String avatarUrl;

  @Column(name = "firebase_uid", unique = true, length = 191)
  private String firebaseUid;

  @Column(name = "activo", nullable = false)
  private boolean activo = true;

  @Column(name = "creado_en", updatable = false, nullable = false)
  private Instant creadoEn;

  @Column(name = "actualizado_en", nullable = false)
  private Instant actualizadoEn;

  // ===== Rol único =====
  @Enumerated(EnumType.STRING)
  @Column(name = "rol", length = 20, nullable = false)
  private Rol rol = Rol.CLIENTE; // por defecto

  // Si el usuario también es barbero, relación 1:1 (opcional)
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "barbero_id")
  private Barbero barbero;

  // ===== Ciclo de vida =====
  @PrePersist
  public void prePersist() {
    Instant now = Instant.now();
    if (creadoEn == null) creadoEn = now;
    if (actualizadoEn == null) actualizadoEn = now;
    // saneo mínimo para nombre/username si vienen nulos (evitar NOT NULL aguas si tu schema lo exige)
    if (nombre == null || nombre.isBlank()) nombre = "Usuario";
    if (username == null || username.isBlank()) username = "user-" + now.getEpochSecond();
  }

  @PreUpdate
  public void preUpdate() {
    this.actualizadoEn = Instant.now();
  }

  // ===== Enums =====
  public enum Proveedor { LOCAL, GOOGLE, FACEBOOK, PHONE, FIREBASE }
  public enum Rol { ADMIN, BARBERO, CLIENTE }

  // ===== Helpers de rol =====
  public boolean isAdmin()   { return rol == Rol.ADMIN; }
  public boolean isBarbero() { return rol == Rol.BARBERO || barbero != null; }
  public boolean isCliente() { return rol == Rol.CLIENTE; }
  public String  getRolName(){ return rol != null ? rol.name() : "CLIENTE"; }
  /** Útil si recibes "ADMIN"/"BARBERO"/"CLIENTE" en texto. */
  public boolean hasRol(String r) {
    return r != null && getRolName().equalsIgnoreCase(r.trim());
  }

  // ===== Getters/Setters =====
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

  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

  public String getTelefonoE164() { return telefonoE164; }
  public void setTelefonoE164(String telefonoE164) { this.telefonoE164 = telefonoE164; }

  public boolean isTelefonoVerificado() { return telefonoVerificado; }
  public void setTelefonoVerificado(boolean telefonoVerificado) { this.telefonoVerificado = telefonoVerificado; }

  public Proveedor getProveedor() { return proveedor; }
  public void setProveedor(Proveedor proveedor) { this.proveedor = proveedor; }

  public String getProveedorId() { return proveedorId; }
  public void setProveedorId(String proveedorId) { this.proveedorId = proveedorId; }

  public String getAvatarUrl() { return avatarUrl; }
  public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

  public String getFirebaseUid() { return firebaseUid; }
  public void setFirebaseUid(String firebaseUid) { this.firebaseUid = firebaseUid; }

  public boolean isActivo() { return activo; }
  public void setActivo(boolean activo) { this.activo = activo; }

  public Instant getCreadoEn() { return creadoEn; }
  public void setCreadoEn(Instant creadoEn) { this.creadoEn = creadoEn; }

  public Instant getActualizadoEn() { return actualizadoEn; }
  public void setActualizadoEn(Instant actualizadoEn) { this.actualizadoEn = actualizadoEn; }

  public Rol getRol() { return rol; }
  public void setRol(Rol rol) { this.rol = rol; }

  public Barbero getBarbero() { return barbero; }
  public void setBarbero(Barbero barbero) { this.barbero = barbero; }
}