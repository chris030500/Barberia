// src/main/java/com/barber/backend/agenda/repository/BarberoHorarioSemanalRepository.java
package com.barber.backend.agenda.repository;

import com.barber.backend.agenda.model.BarberoHorarioSemanal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface BarberoHorarioSemanalRepository extends JpaRepository<BarberoHorarioSemanal, Long> {

  // Todos los tramos de un barbero, ordenados
  List<BarberoHorarioSemanal> findByBarbero_IdOrderByDowAsc(Long barberoId);

  // Usado por AgendaService para obtener horarios activos de un DOW
  List<BarberoHorarioSemanal> findByBarbero_IdAndDowAndActivoTrue(Long barberoId, Integer dow);

  // Útiles opcionales:
  BarberoHorarioSemanal findFirstByBarbero_IdAndDowAndActivoTrueOrderByDesdeAsc(Long barberoId, Integer dow);
  boolean existsByBarbero_IdAndDowAndActivoTrue(Long barberoId, Integer dow);

  // Borrar por barbero (marcado como modifying + transactional para claridad)
  @Modifying
  @Transactional
  void deleteByBarbero_Id(Long barberoId);
}