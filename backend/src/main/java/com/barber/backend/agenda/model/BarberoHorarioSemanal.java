package com.barber.backend.agenda.model;

import com.barber.backend.barberos.model.Barbero;
import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "barbero_horario_semanal")
public class BarberoHorarioSemanal {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "barbero_id", nullable = false)
  private Barbero barbero;

  /** 0=domingo ... 6=sábado */
  @Column(nullable = false)
  private Integer dow;

  @Column(nullable = false)
  private LocalTime desde;

  @Column(nullable = false)
  private LocalTime hasta;

  @Column(nullable = false)
  private Boolean activo = Boolean.TRUE;

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

  public Integer getDow() {
    return dow;
  }

  public void setDow(Integer dow) {
    this.dow = dow;
  }

  public LocalTime getDesde() {
    return desde;
  }

  public void setDesde(LocalTime desde) {
    this.desde = desde;
  }

  public LocalTime getHasta() {
    return hasta;
  }

  public void setHasta(LocalTime hasta) {
    this.hasta = hasta;
  }

  public Boolean getActivo() {
    return activo;
  }

  public void setActivo(Boolean activo) {
    this.activo = activo;
  }

 
}
