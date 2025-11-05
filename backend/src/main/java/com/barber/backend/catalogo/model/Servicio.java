package com.barber.backend.catalogo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.Instant;

@Entity
@Table(name = "servicios",
       uniqueConstraints = @UniqueConstraint(name = "uk_servicios_nombre", columnNames = "nombre"))
public class Servicio {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank @Size(max = 120)
  private String nombre;

  @Size(max = 500)
  private String descripcion;

  @Column(name = "duracion_min", nullable = false)
  @Min(5) @Max(480)
  private Integer duracionMin;

  @Column(name = "precio_centavos", nullable = false)
  @Min(0)
  private Integer precioCentavos;

  @Column(nullable = false)
  private boolean activo = true;

  @Column(name = "creado_en", nullable = false, updatable = false)
  private Instant creadoEn = Instant.now();

  @Column(name = "actualizado_en", nullable = false)
  private Instant actualizadoEn = Instant.now();

  @PreUpdate
  public void preUpdate() { actualizadoEn = Instant.now(); }

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

  public String getDescripcion() {
    return descripcion;
  }

  public void setDescripcion(String descripcion) {
    this.descripcion = descripcion;
  }

  public Integer getDuracionMin() {
    return duracionMin;
  }

  public void setDuracionMin(Integer duracionMin) {
    this.duracionMin = duracionMin;
  }

  public Integer getPrecioCentavos() {
    return precioCentavos;
  }

  public void setPrecioCentavos(Integer precioCentavos) {
    this.precioCentavos = precioCentavos;
  }

  public boolean isActivo() {
    return activo;
  }

  public void setActivo(boolean activo) {
    this.activo = activo;
  }

  public Instant getCreadoEn() {
    return creadoEn;
  }

  public void setCreadoEn(Instant creadoEn) {
    this.creadoEn = creadoEn;
  }

  public Instant getActualizadoEn() {
    return actualizadoEn;
  }

  public void setActualizadoEn(Instant actualizadoEn) {
    this.actualizadoEn = actualizadoEn;
  }

  
}