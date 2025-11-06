// src/main/java/com/barber/backend/agenda/repository/BarberoBloqueoRepository.java
package com.barber.backend.agenda.repository;

import com.barber.backend.agenda.model.BarberoBloqueo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface BarberoBloqueoRepository extends JpaRepository<BarberoBloqueo, Long> {

  List<BarberoBloqueo> findByBarberoIdAndInicioLessThanAndFinGreaterThan(
      Long barberoId,
      Instant hasta,  // end of day
      Instant desde   // start of day
  );

  // Bloqueos que traslapan con [desde, hasta] (fin > desde && inicio < hasta)
  List<BarberoBloqueo> findByBarbero_IdAndFinGreaterThanAndInicioLessThan(
      Long barberoId, Instant desde, Instant hasta
  );

  // Conteo de traslapes (útil para validación)
  long countByBarbero_IdAndFinGreaterThanAndInicioLessThan(
      Long barberoId, Instant desde, Instant hasta
  );

  // Para update, excluyendo un id
  long countByBarbero_IdAndIdNotAndFinGreaterThanAndInicioLessThan(
      Long barberoId, Long excludeId, Instant desde, Instant hasta
  );

  List<BarberoBloqueo> findTop5ByBarbero_IdAndFinAfterOrderByInicioAsc(
      Long barberoId,
      Instant fin
  );
}