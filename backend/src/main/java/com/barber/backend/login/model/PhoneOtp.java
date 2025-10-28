package com.barber.backend.login.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name = "phone_otps")
public class PhoneOtp {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name="telefono_e164", nullable=false, length=20)
  private String telefonoE164;

  @Column(name="code_hash", nullable=false, length=100)
  private String codeHash;

  @Column(name="vence_en", nullable=false)
  private LocalDateTime venceEn;

  private Integer intentos = 0;
  @Column(name="max_intentos", nullable=false) private Integer maxIntentos = 5;

  @Enumerated(EnumType.STRING) private Canal canal = Canal.SMS;

  @Enumerated(EnumType.STRING)
  @Column(name="purpose", nullable=false, length=10)
  private Purpose purpose = Purpose.LOGIN; // 👈 NUEVO

  @Column(nullable=false) private boolean consumido = false;

  @Column(name="creado_en") private LocalDateTime creadoEn = LocalDateTime.now();

  public enum Canal { SMS, WHATSAPP }
  public enum Purpose { LOGIN, LINK } // 👈 NUEVO
  public Long getId() {
    return id;
  }
  public void setId(Long id) {
    this.id = id;
  }
  public String getTelefonoE164() {
    return telefonoE164;
  }
  public void setTelefonoE164(String telefonoE164) {
    this.telefonoE164 = telefonoE164;
  }
  public String getCodeHash() {
    return codeHash;
  }
  public void setCodeHash(String codeHash) {
    this.codeHash = codeHash;
  }
  public LocalDateTime getVenceEn() {
    return venceEn;
  }
  public void setVenceEn(LocalDateTime venceEn) {
    this.venceEn = venceEn;
  }
  public Integer getIntentos() {
    return intentos;
  }
  public void setIntentos(Integer intentos) {
    this.intentos = intentos;
  }
  public Integer getMaxIntentos() {
    return maxIntentos;
  }
  public void setMaxIntentos(Integer maxIntentos) {
    this.maxIntentos = maxIntentos;
  }
  public Canal getCanal() {
    return canal;
  }
  public void setCanal(Canal canal) {
    this.canal = canal;
  }
  public Purpose getPurpose() {
    return purpose;
  }
  public void setPurpose(Purpose purpose) {
    this.purpose = purpose;
  }
  public boolean isConsumido() {
    return consumido;
  }
  public void setConsumido(boolean consumido) {
    this.consumido = consumido;
  }
  public LocalDateTime getCreadoEn() {
    return creadoEn;
  }
  public void setCreadoEn(LocalDateTime creadoEn) {
    this.creadoEn = creadoEn;
  }

  
}