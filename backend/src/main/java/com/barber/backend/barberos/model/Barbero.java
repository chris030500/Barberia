package com.barber.backend.barberos.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "barberos")
public class Barbero {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 120)
  private String nombre;

  @Column(name = "telefono_e164", length = 20)
  private String telefonoE164;

  @Column(length = 500)
  private String descripcion;

  @Column(name = "avatar_url", length = 300)
  private String avatarUrl;

  @Column(name = "email_profesional", length = 160)
  private String emailProfesional;

  @Column(name = "instagram_handle", length = 80)
  private String instagramHandle;

  @Column(name = "portafolio_url", length = 300)
  private String portafolioUrl;

  @Column(length = 160)
  private String slogan;

  @Column(name = "experiencia_anos")
  private Integer experienciaAnos;

  @Column(nullable = false)
  private Boolean activo = true;

  @Column(name = "creado_en", nullable = false)
  private Instant creadoEn = Instant.now();

  @Column(name = "actualizado_en")
  private Instant actualizadoEn;

  @ManyToMany
  @JoinTable(
      name = "barbero_servicio",
      joinColumns = @JoinColumn(name = "barbero_id"),
      inverseJoinColumns = @JoinColumn(name = "servicio_id")
  )
  private Set<com.barber.backend.catalogo.model.Servicio> servicios = new LinkedHashSet<>();

  @ElementCollection(fetch = FetchType.LAZY)
  @CollectionTable(name = "barbero_especialidades", joinColumns = @JoinColumn(name = "barbero_id"))
  @Column(name = "especialidad", length = 80)
  private Set<String> especialidades = new LinkedHashSet<>();

  // getters & setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }

  public String getTelefonoE164() { return telefonoE164; }
  public void setTelefonoE164(String telefonoE164) { this.telefonoE164 = telefonoE164; }

  public String getDescripcion() { return descripcion; }
  public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

  public String getAvatarUrl() { return avatarUrl; }
  public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

  public String getEmailProfesional() { return emailProfesional; }
  public void setEmailProfesional(String emailProfesional) { this.emailProfesional = emailProfesional; }

  public String getInstagramHandle() { return instagramHandle; }
  public void setInstagramHandle(String instagramHandle) { this.instagramHandle = instagramHandle; }

  public String getPortafolioUrl() { return portafolioUrl; }
  public void setPortafolioUrl(String portafolioUrl) { this.portafolioUrl = portafolioUrl; }

  public String getSlogan() { return slogan; }
  public void setSlogan(String slogan) { this.slogan = slogan; }

  public Integer getExperienciaAnos() { return experienciaAnos; }
  public void setExperienciaAnos(Integer experienciaAnos) { this.experienciaAnos = experienciaAnos; }

  public Boolean getActivo() { return activo; }
  public void setActivo(Boolean activo) { this.activo = activo; }

  public Instant getCreadoEn() { return creadoEn; }
  public void setCreadoEn(Instant creadoEn) { this.creadoEn = creadoEn; }

  public Instant getActualizadoEn() { return actualizadoEn; }
  public void setActualizadoEn(Instant actualizadoEn) { this.actualizadoEn = actualizadoEn; }

  public Set<com.barber.backend.catalogo.model.Servicio> getServicios() { return servicios; }
  public void setServicios(Set<com.barber.backend.catalogo.model.Servicio> servicios) { this.servicios = servicios; }

  public Set<String> getEspecialidades() { return especialidades; }
  public void setEspecialidades(Set<String> especialidades) { this.especialidades = especialidades; }
}
