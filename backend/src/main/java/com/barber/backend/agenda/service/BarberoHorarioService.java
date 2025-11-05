// src/main/java/com/barber/backend/agenda/service/BarberoHorarioService.java
package com.barber.backend.agenda.service;

import com.barber.backend.agenda.dto.BarberoHorarioDTO;
import com.barber.backend.agenda.model.BarberoHorarioSemanal;
import com.barber.backend.agenda.repository.BarberoHorarioSemanalRepository;
import com.barber.backend.barberos.model.Barbero;
import com.barber.backend.barberos.repository.BarberoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

@Service
public class BarberoHorarioService {

  private final BarberoHorarioSemanalRepository repo;
  private final BarberoRepository barberoRepo;

  public BarberoHorarioService(BarberoHorarioSemanalRepository repo, BarberoRepository barberoRepo) {
    this.repo = repo;
    this.barberoRepo = barberoRepo;
  }

  @Transactional(readOnly = true)
  public List<BarberoHorarioDTO> getHorario(Long barberoId) {
    barberoRepo.findById(barberoId).orElseThrow(() -> new EntityNotFoundException("Barbero no encontrado"));
    return repo.findByBarbero_IdOrderByDowAsc(barberoId).stream()
        .sorted(Comparator.comparing(BarberoHorarioSemanal::getDow))
        .map(h -> new BarberoHorarioDTO(
            h.getDow(),
            h.getDesde().toString(),
            h.getHasta().toString(),
            h.getActivo() != null ? h.getActivo() : Boolean.TRUE
        ))
        .toList();
  }

  /** Reemplaza todo el horario semanal del barbero (DELETE + INSERT) en una sola transacción. */
  @Transactional
  public List<BarberoHorarioDTO> replaceHorario(Long barberoId, List<BarberoHorarioDTO> items) {
    Barbero barbero = barberoRepo.findById(barberoId)
        .orElseThrow(() -> new EntityNotFoundException("Barbero no encontrado"));

    // Validaciones rápidas
    for (BarberoHorarioDTO dto : items) {
      if (dto.dow() == null || dto.dow() < 0 || dto.dow() > 6)
        throw new IllegalArgumentException("dow inválido: " + dto.dow());
      if (dto.desde() == null || dto.hasta() == null)
        throw new IllegalArgumentException("desde/hasta son requeridos");
      LocalTime desde = LocalTime.parse(dto.desde());
      LocalTime hasta = LocalTime.parse(dto.hasta());
      if (!desde.isBefore(hasta))
        throw new IllegalArgumentException("desde debe ser anterior a hasta (dow=" + dto.dow() + ")");
    }

    // 1) borrar horario previo del barbero
    repo.deleteByBarbero_Id(barberoId);

    // 2) insertar nuevos tramos
    List<BarberoHorarioSemanal> toSave = items.stream().map(dto -> {
      BarberoHorarioSemanal h = new BarberoHorarioSemanal();
      h.setBarbero(barbero);
      h.setDow(dto.dow());
      h.setDesde(LocalTime.parse(dto.desde()));
      h.setHasta(LocalTime.parse(dto.hasta()));
      h.setActivo(dto.activo() != null ? dto.activo() : Boolean.TRUE);
      return h;
    }).toList();

    repo.saveAll(toSave);

    // 3) devolver el horario resultante
    return getHorario(barberoId);
  }
}