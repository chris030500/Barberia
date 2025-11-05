// src/main/java/com/barber/backend/agenda/service/BarberoBloqueoService.java
package com.barber.backend.agenda.service;

import com.barber.backend.agenda.dto.BarberoBloqueoDTO;
import com.barber.backend.agenda.dto.BarberoBloqueoSaveRequest;
import com.barber.backend.agenda.model.BarberoBloqueo;
import com.barber.backend.agenda.repository.BarberoBloqueoRepository;
import com.barber.backend.barberos.model.Barbero;
import com.barber.backend.barberos.repository.BarberoRepository;
import com.barber.backend.citas.repository.CitaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class BarberoBloqueoService {

  private final BarberoBloqueoRepository repo;
  private final BarberoRepository barberoRepo;
  private final CitaRepository citaRepo;

  public BarberoBloqueoService(BarberoBloqueoRepository repo,
                               BarberoRepository barberoRepo,
                               CitaRepository citaRepo) {
    this.repo = repo;
    this.barberoRepo = barberoRepo;
    this.citaRepo = citaRepo;
  }

  @Transactional(readOnly = true)
  public List<BarberoBloqueoDTO> list(Long barberoId, Instant desde, Instant hasta) {
    ensureBarberoExists(barberoId);
    // Si no pasan rango, trae todo el día/semana según tu caso; aquí obligamos rango:
    if (desde == null || hasta == null) {
      throw new IllegalArgumentException("Parámetros 'desde' y 'hasta' son requeridos");
    }
    if (!desde.isBefore(hasta)) {
      throw new IllegalArgumentException("'desde' debe ser anterior a 'hasta'");
    }
    return repo.findByBarbero_IdAndFinGreaterThanAndInicioLessThan(barberoId, desde, hasta)
        .stream().map(this::toDTO).toList();
  }

  @Transactional
  public BarberoBloqueoDTO create(Long barberoId, BarberoBloqueoSaveRequest in) {
    Barbero barbero = ensureBarberoExists(barberoId);
    validateRange(in.inicio(), in.fin());

    // Validar empalme con bloqueos existentes
    long overlaps = repo.countByBarbero_IdAndFinGreaterThanAndInicioLessThan(barberoId, in.inicio(), in.fin());
    if (overlaps > 0) {
      throw new IllegalStateException("Ya existe un bloqueo que traslapa ese rango");
    }

    // Validar empalme con citas AGENDADA
    long citas = citaRepo.countOverlaps(barberoId, in.inicio(), in.fin());
    if (citas > 0) {
      throw new IllegalStateException("Hay citas ya agendadas en ese rango; cancélalas antes de bloquear");
    }

    BarberoBloqueo b = new BarberoBloqueo();
    b.setBarbero(barbero);
    b.setInicio(in.inicio());
    b.setFin(in.fin());
    b.setMotivo(in.motivo());

    return toDTO(repo.save(b));
  }

  @Transactional
  public BarberoBloqueoDTO update(Long barberoId, Long bloqueoId, BarberoBloqueoSaveRequest in) {
    ensureBarberoExists(barberoId);
    BarberoBloqueo b = repo.findById(bloqueoId)
        .orElseThrow(() -> new EntityNotFoundException("Bloqueo no encontrado"));

    if (!b.getBarbero().getId().equals(barberoId)) {
      throw new IllegalArgumentException("El bloqueo no pertenece al barbero indicado");
    }

    validateRange(in.inicio(), in.fin());

    long overlaps = repo.countByBarbero_IdAndIdNotAndFinGreaterThanAndInicioLessThan(
        barberoId, bloqueoId, in.inicio(), in.fin());
    if (overlaps > 0) {
      throw new IllegalStateException("Traslapa con otro bloqueo existente");
    }

    long citas = citaRepo.countOverlaps(barberoId, in.inicio(), in.fin());
    if (citas > 0) {
      throw new IllegalStateException("Hay citas agendadas en el rango; no se puede mover el bloqueo ahí");
    }

    b.setInicio(in.inicio());
    b.setFin(in.fin());
    b.setMotivo(in.motivo());
    return toDTO(repo.save(b));
  }

  @Transactional
  public void delete(Long barberoId, Long bloqueoId) {
    ensureBarberoExists(barberoId);
    BarberoBloqueo b = repo.findById(bloqueoId)
        .orElseThrow(() -> new EntityNotFoundException("Bloqueo no encontrado"));
    if (!b.getBarbero().getId().equals(barberoId)) {
      throw new IllegalArgumentException("El bloqueo no pertenece al barbero indicado");
    }
    repo.delete(b);
  }

  // ===== Helpers =====

  private Barbero ensureBarberoExists(Long barberoId) {
    return barberoRepo.findById(barberoId)
        .orElseThrow(() -> new EntityNotFoundException("Barbero no encontrado"));
  }

  private static void validateRange(Instant inicio, Instant fin) {
    if (inicio == null || fin == null) {
      throw new IllegalArgumentException("inicio/fin son requeridos");
    }
    if (!inicio.isBefore(fin)) {
      throw new IllegalArgumentException("inicio debe ser anterior a fin");
    }
  }

  private BarberoBloqueoDTO toDTO(BarberoBloqueo b) {
    return new BarberoBloqueoDTO(
        b.getId(),
        b.getBarbero() != null ? b.getBarbero().getId() : null,
        b.getInicio(),
        b.getFin(),
        b.getMotivo()
    );
  }
}