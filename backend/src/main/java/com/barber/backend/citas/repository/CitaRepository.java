package com.barber.backend.citas.repository;

import com.barber.backend.citas.model.Cita;
import com.barber.backend.citas.model.Cita.Estado;
import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CitaRepository extends JpaRepository<Cita, Long> {

  @Query(value = """
      SELECT c
      FROM Cita c
      WHERE (:barberoId IS NULL OR c.barbero.id = :barberoId)
        AND (:estado   IS NULL OR c.estado = :estado)
        AND (c.inicio < :hasta AND c.fin > :desde)
      ORDER BY c.inicio ASC
      """, countQuery = """
      SELECT COUNT(c)
      FROM Cita c
      WHERE (:barberoId IS NULL OR c.barbero.id = :barberoId)
        AND (:estado   IS NULL OR c.estado = :estado)
        AND (c.inicio < :hasta AND c.fin > :desde)
      """)
  Page<Cita> findByFiltro(
      @Param("barberoId") Long barberoId,
      @Param("estado") Estado estado,
      @Param("desde") Instant desde,
      @Param("hasta") Instant hasta,
      Pageable pageable);

  /**
   * Para CREAR: valida empalmes de citas AGENDADAS en el rango dado.
   */
  @Query("""
        SELECT COUNT(c)
        FROM Cita c
        WHERE c.barbero.id = :barberoId
          AND c.estado = com.barber.backend.citas.model.Cita.Estado.AGENDADA
          AND (c.inicio < :fin AND c.fin > :inicio)
      """)
  long countOverlaps(@Param("barberoId") Long barberoId,
      @Param("inicio") Instant inicio,
      @Param("fin") Instant fin);

  /**
   * Para EDITAR: igual que countOverlaps pero excluyendo el propio id de la cita.
   */
  @Query("""
        SELECT COUNT(c)
        FROM Cita c
        WHERE c.barbero.id = :barberoId
          AND c.estado = com.barber.backend.citas.model.Cita.Estado.AGENDADA
          AND c.id <> :citaId
          AND (c.inicio < :fin AND c.fin > :inicio)
      """)
  long countOverlapsExcludingId(@Param("barberoId") Long barberoId,
      @Param("inicio") Instant inicio,
      @Param("fin") Instant fin,
      @Param("citaId") Long citaId);

  @Query("""
        SELECT c FROM Cita c
        WHERE c.barbero.id = :barberoId
          AND c.estado = com.barber.backend.citas.model.Cita.Estado.AGENDADA
          AND (c.inicio < :hasta AND c.fin > :desde)
      """)
  List<Cita> findAgendadasDelBarberoEnRango(Long barberoId, Instant desde, Instant hasta);

  @Query("""
        SELECT COUNT(c)
        FROM Cita c
        WHERE c.estado = :estado
          AND c.inicio >= :desde AND c.inicio < :hasta
      """)
  long countByEstadoBetween(
      @Param("estado") com.barber.backend.citas.model.Cita.Estado estado,
      @Param("desde") Instant desde,
      @Param("hasta") Instant hasta);

  @Query("""
        SELECT COALESCE(SUM(COALESCE(c.overridePrecioCentavos, c.servicio.precioCentavos)), 0)
        FROM Cita c
        WHERE c.estado = com.barber.backend.citas.model.Cita.Estado.COMPLETADA
          AND c.inicio >= :desde AND c.inicio < :hasta
      """)
  Long sumIngresosCompletadasBetween(@Param("desde") Instant desde, @Param("hasta") Instant hasta);

  @Query("""
        SELECT COUNT(c)
        FROM Cita c
        WHERE c.barbero.id = :barberoId
          AND c.estado = :estado
          AND c.inicio >= :desde AND c.inicio < :hasta
      """)
  long countByBarberoAndEstadoBetween(
      @Param("barberoId") Long barberoId,
      @Param("estado") com.barber.backend.citas.model.Cita.Estado estado,
      @Param("desde") Instant desde,
      @Param("hasta") Instant hasta);

  @Query("""
        SELECT COALESCE(SUM(COALESCE(c.overridePrecioCentavos, c.servicio.precioCentavos)), 0)
        FROM Cita c
        WHERE c.barbero.id = :barberoId
          AND c.estado = com.barber.backend.citas.model.Cita.Estado.COMPLETADA
          AND c.inicio >= :desde AND c.inicio < :hasta
      """)
  Long sumIngresosCompletadasBarberoBetween(
      @Param("barberoId") Long barberoId,
      @Param("desde") Instant desde,
      @Param("hasta") Instant hasta);

  @Query("""
        SELECT c
        FROM Cita c
        WHERE c.barbero.id = :barberoId
          AND c.estado = com.barber.backend.citas.model.Cita.Estado.AGENDADA
          AND c.inicio >= :desde
        ORDER BY c.inicio ASC
      """)
  List<Cita> findProximasCitasBarbero(
      @Param("barberoId") Long barberoId,
      @Param("desde") Instant desde,
      Pageable pageable);

  @Query("""
        SELECT c
        FROM Cita c
        WHERE c.clienteTelE164 = :telefono
          AND c.estado = com.barber.backend.citas.model.Cita.Estado.AGENDADA
          AND c.inicio >= :desde
        ORDER BY c.inicio ASC
      """)
  List<Cita> findProximasCitasCliente(
      @Param("telefono") String telefono,
      @Param("desde") Instant desde,
      Pageable pageable);

  long countByClienteTelE164AndEstado(
      String clienteTelE164,
      com.barber.backend.citas.model.Cita.Estado estado);

  long countByClienteTelE164AndEstadoAndInicioAfter(
      String clienteTelE164,
      com.barber.backend.citas.model.Cita.Estado estado,
      Instant inicio);

  @Query("""
        SELECT c
        FROM Cita c
        WHERE c.clienteTelE164 = :telefono
          AND c.estado = com.barber.backend.citas.model.Cita.Estado.COMPLETADA
        ORDER BY c.inicio DESC
      """)
  List<Cita> findUltimasCitasCliente(
      @Param("telefono") String telefono,
      Pageable pageable);
}
