package com.barber.backend.agenda.model;

import com.barber.backend.barberos.model.Barbero;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "barbero_bloqueo")
public class BarberoBloqueo {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "barbero_id", nullable = false)
  private Barbero barbero;

  @Column(nullable = false)
  private Instant inicio;

  @Column(nullable = false)
  private Instant fin;

  private String motivo;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn;

  @PrePersist
  void pre() {
    if (creadoEn == null) creadoEn = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Barbero getBarbero() {
    return barbero;
  }

  public void setBarbero(Barbero barbero) {
    this.barbero = barbero;
  }

  public Instant getInicio() {
    return inicio;
  }

  public void setInicio(Instant inicio) {
    this.inicio = inicio;
  }

  public Instant getFin() {
    return fin;
  }

  public void setFin(Instant fin) {
    this.fin = fin;
  }

  public String getMotivo() {
    return motivo;
  }

  public void setMotivo(String motivo) {
    this.motivo = motivo;
  }

  public Instant getCreadoEn() {
    return creadoEn;
  }

  public void setCreadoEn(Instant creadoEn) {
    this.creadoEn = creadoEn;
  }
  
}
