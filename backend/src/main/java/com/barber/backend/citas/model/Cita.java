package com.barber.backend.citas.model;

import com.barber.backend.barberos.model.Barbero;
import com.barber.backend.catalogo.model.Servicio;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

@Entity
@Table(name = "citas")
public class Cita {

  public enum Estado { AGENDADA, CANCELADA, COMPLETADA }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "barbero_id", nullable = false)
  private Barbero barbero;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "servicio_id", nullable = false)
  private Servicio servicio;

  @NotNull
  @Column(name = "cliente_nombre", nullable = false, length = 200)
  private String clienteNombre;

  @Column(name = "cliente_tel_e164", length = 32)
  private String clienteTelE164;

  @NotNull
  @Column(name = "inicio", nullable = false)
  private Instant inicio;

  @NotNull
  @Column(name = "fin", nullable = false)
  private Instant fin;

  @Enumerated(EnumType.STRING) // ⬅️ IMPORTANTE: enum como texto
  @Column(name = "estado", nullable = false, length = 20)
  private Estado estado = Estado.AGENDADA;

  // Overrides (opcionales)
  @Column(name = "override_duracion_min")
  private Integer overrideDuracionMin;       // si null, usa servicio.duracionMin

  @Column(name = "override_precio_centavos")
  private Integer overridePrecioCentavos;    // si null, usa servicio.precioCentavos

  @Column(name = "notas", length = 1000)
  private String notas;

  @Column(name = "creado_en", nullable = false, updatable = false)
  private Instant creadoEn;

  @Column(name = "actualizado_en")
  private Instant actualizadoEn;

  /* ===== Lifecycle ===== */
  @PrePersist
  public void prePersist() {
    if (creadoEn == null) creadoEn = Instant.now();
    if (estado == null) estado = Estado.AGENDADA;
    recomputeFinIfNeeded();
  }

  @PreUpdate
  public void preUpdate() {
    actualizadoEn = Instant.now();
    recomputeFinIfNeeded();
  }

  private void recomputeFinIfNeeded() {
    if (inicio == null || servicio == null) return;
    int durMin = (overrideDuracionMin != null && overrideDuracionMin > 0)
        ? overrideDuracionMin
        : (servicio.getDuracionMin() != null ? servicio.getDuracionMin() : 0);
    if (durMin <= 0) durMin = 1;
    this.fin = inicio.plusSeconds(durMin * 60L);
  }

  /* ===== Getters/Setters ===== */
  public Long getId() { return id; }
  public Barbero getBarbero() { return barbero; }
  public void setBarbero(Barbero barbero) { this.barbero = barbero; }
  public Servicio getServicio() { return servicio; }
  public void setServicio(Servicio servicio) { this.servicio = servicio; }
  public String getClienteNombre() { return clienteNombre; }
  public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
  public String getClienteTelE164() { return clienteTelE164; }
  public void setClienteTelE164(String clienteTelE164) { this.clienteTelE164 = clienteTelE164; }
  public Instant getInicio() { return inicio; }
  public void setInicio(Instant inicio) { this.inicio = inicio; }
  public Instant getFin() { return fin; }
  public void setFin(Instant fin) { this.fin = fin; }
  public Estado getEstado() { return estado; }
  public void setEstado(Estado estado) { this.estado = estado; }
  public Integer getOverrideDuracionMin() { return overrideDuracionMin; }
  public void setOverrideDuracionMin(Integer overrideDuracionMin) { this.overrideDuracionMin = overrideDuracionMin; }
  public Integer getOverridePrecioCentavos() { return overridePrecioCentavos; }
  public void setOverridePrecioCentavos(Integer overridePrecioCentavos) { this.overridePrecioCentavos = overridePrecioCentavos; }
  public String getNotas() { return notas; }
  public void setNotas(String notas) { this.notas = notas; }
  public Instant getCreadoEn() { return creadoEn; }
  public void setCreadoEn(Instant creadoEn) { this.creadoEn = creadoEn; }
  public Instant getActualizadoEn() { return actualizadoEn; }
  public void setActualizadoEn(Instant actualizadoEn) { this.actualizadoEn = actualizadoEn; }
}