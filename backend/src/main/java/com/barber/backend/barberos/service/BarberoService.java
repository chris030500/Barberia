// src/main/java/com/barber/backend/barberos/service/BarberoService.java
package com.barber.backend.barberos.service;

import com.barber.backend.barberos.dto.BarberoDTO;
import com.barber.backend.barberos.dto.BarberoSaveRequest;
import com.barber.backend.barberos.model.Barbero;
import com.barber.backend.barberos.repository.BarberoRepository;
import com.barber.backend.catalogo.model.Servicio;
import com.barber.backend.catalogo.repository.ServicioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // 👈

import java.time.Instant;
import java.util.List;

@Service
public class BarberoService {

  private final BarberoRepository repo;
  private final ServicioRepository servicioRepo;

  public BarberoService(BarberoRepository repo, ServicioRepository servicioRepo) {
    this.repo = repo;
    this.servicioRepo = servicioRepo;
  }

  @Transactional(readOnly = true) // 👈 mantiene la sesión viva durante el map()
  public Page<BarberoDTO> list(Pageable pageable, Boolean soloActivos) {
    var page = (soloActivos != null && soloActivos)
        ? repo.findByActivoTrue(pageable)
        : repo.findAll(pageable);
    return page.map(this::toDTO);
  }

  @Transactional(readOnly = true) // 👈 igual aquí
  public BarberoDTO get(Long id) {
    return repo.findById(id).map(this::toDTO)
        .orElseThrow(() -> new EntityNotFoundException("Barbero no encontrado"));
  }

  @Transactional // escritura
  public BarberoDTO create(BarberoSaveRequest in) {
    Barbero b = new Barbero();
    apply(b, in);
    b.setCreadoEn(Instant.now());
    return toDTO(repo.save(b));
  }

  @Transactional // escritura
  public BarberoDTO update(Long id, BarberoSaveRequest in) {
    Barbero b = repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Barbero no encontrado"));
    apply(b, in);
    b.setActualizadoEn(Instant.now());
    return toDTO(repo.save(b));
  }

  @Transactional // escritura
  public void delete(Long id) {
    repo.deleteById(id);
  }

  private void apply(Barbero b, BarberoSaveRequest in) {
    b.setNombre(in.nombre());
    b.setTelefonoE164(in.telefonoE164());
    b.setDescripcion(in.descripcion());
    b.setAvatarUrl(in.avatarUrl());
    b.setActivo(in.activo() == null ? Boolean.TRUE : in.activo());

    b.getServicios().clear();
    if (in.servicios() != null && !in.servicios().isEmpty()) {
      List<Servicio> servicios = servicioRepo.findAllById(in.servicios());
      b.getServicios().addAll(servicios);
    }
  }

  private BarberoDTO toDTO(Barbero b) {
    var servicios = b.getServicios(); // podría ser LAZY
    var ids = (servicios == null ? List.<Servicio>of() : servicios)
        .stream().map(Servicio::getId).toList();

    return new BarberoDTO(
        b.getId(), b.getNombre(), b.getTelefonoE164(), b.getDescripcion(), b.getAvatarUrl(),
        b.getActivo(), b.getCreadoEn(), b.getActualizadoEn(), ids
    );
  }
}