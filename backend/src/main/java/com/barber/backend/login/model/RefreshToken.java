package com.barber.backend.login.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name = "refresh_tokens",
  indexes = {
      @Index(columnList = "usuario_id"),
      @Index(columnList = "token_hash"),
      @Index(columnList = "jti", unique = true)
  }
)
public class RefreshToken {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name="usuario_id", nullable=false)
  private Long usuarioId;

  @Column(name="jti", nullable=false, length = 40)
  private String jti;

  @Column(name="token_hash", nullable=false, length=100)
  private String tokenHash;

  @Column(name="expira_en", nullable=false)
  private LocalDateTime expiraEn;

  @Column(name="revocado", nullable=false)
  private boolean revocado = false;

  @Column(name="user_agent") private String userAgent;
  @Column(name="ip") private String ip;

  @Column(name="creado_en", nullable=false)
  private LocalDateTime creadoEn = LocalDateTime.now();

  // getters/setters...
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getUsuarioId() { return usuarioId; }
  public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
  public String getJti() { return jti; }
  public void setJti(String jti) { this.jti = jti; }
  public String getTokenHash() { return tokenHash; }
  public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
  public LocalDateTime getExpiraEn() { return expiraEn; }
  public void setExpiraEn(LocalDateTime expiraEn) { this.expiraEn = expiraEn; }
  public boolean isRevocado() { return revocado; }
  public void setRevocado(boolean revocado) { this.revocado = revocado; }
  public String getUserAgent() { return userAgent; }
  public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
  public String getIp() { return ip; }
  public void setIp(String ip) { this.ip = ip; }
  public LocalDateTime getCreadoEn() { return creadoEn; }
  public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }
}