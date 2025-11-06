package com.barber.backend.agenda.service;

import com.barber.backend.agenda.dto.BarberoBloqueoDTO;
import com.barber.backend.agenda.dto.BarberoDisponibilidadBarberoDTO;
import com.barber.backend.agenda.dto.BarberoDisponibilidadCitaDTO;
import com.barber.backend.agenda.dto.BarberoDisponibilidadMetricsDTO;
import com.barber.backend.agenda.dto.BarberoDisponibilidadResumenDTO;
import com.barber.backend.agenda.dto.BarberoHorarioDTO;
import com.barber.backend.agenda.dto.BarberoServicioResumenDTO;
import com.barber.backend.agenda.model.BarberoBloqueo;
import com.barber.backend.agenda.repository.BarberoBloqueoRepository;
import com.barber.backend.barberos.model.Barbero;
import com.barber.backend.barberos.repository.BarberoRepository;
import com.barber.backend.catalogo.model.Servicio;
import com.barber.backend.citas.model.Cita;
import com.barber.backend.citas.repository.CitaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BarberoDisponibilidadFacade {

  private static final int MAX_ITEMS = 5;
  private static final Duration HORIZON = Duration.ofDays(30);

  private final BarberoRepository barberoRepository;
  private final BarberoHorarioService horarioService;
  private final BarberoBloqueoRepository bloqueoRepository;
  private final CitaRepository citaRepository;

  public BarberoDisponibilidadFacade(BarberoRepository barberoRepository,
                                     BarberoHorarioService horarioService,
                                     BarberoBloqueoRepository bloqueoRepository,
                                     CitaRepository citaRepository) {
    this.barberoRepository = barberoRepository;
    this.horarioService = horarioService;
    this.bloqueoRepository = bloqueoRepository;
    this.citaRepository = citaRepository;
  }

  @Transactional(readOnly = true)
  public BarberoDisponibilidadResumenDTO resumen(Long barberoId) {
    Barbero barbero = barberoRepository.findById(barberoId)
        .orElseThrow(() -> new EntityNotFoundException("Barbero no encontrado"));

    List<BarberoHorarioDTO> horario = horarioService.getHorario(barberoId);

    Instant now = Instant.now();
    Instant horizon = now.plus(HORIZON);

    List<BarberoBloqueoDTO> proximosBloqueos = bloqueoRepository
        .findTop5ByBarbero_IdAndFinAfterOrderByInicioAsc(barberoId, now)
        .stream()
        .filter(b -> b.getInicio().isBefore(horizon))
        .map(this::toBloqueoDTO)
        .collect(Collectors.toList());

    List<BarberoDisponibilidadCitaDTO> proximasCitas = citaRepository
        .findProximasCitasBarbero(barberoId, now, PageRequest.of(0, MAX_ITEMS))
        .stream()
        .filter(c -> c.getInicio().isBefore(horizon))
        .map(this::toCitaDTO)
        .collect(Collectors.toList());

    BarberoDisponibilidadBarberoDTO barberoDTO = new BarberoDisponibilidadBarberoDTO(
        barbero.getId(),
        barbero.getNombre(),
        barbero.getTelefonoE164(),
        barbero.getDescripcion(),
        barbero.getAvatarUrl(),
        barbero.getActivo(),
        barbero.getServicios().stream()
            .sorted(Comparator.comparing(Servicio::getNombre, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(this::toServicioDTO)
            .collect(Collectors.toList())
    );

    BarberoDisponibilidadMetricsDTO metrics = buildMetrics(barbero, horario, proximosBloqueos, proximasCitas);

    return new BarberoDisponibilidadResumenDTO(
        barberoDTO,
        horario,
        metrics,
        proximosBloqueos,
        proximasCitas
    );
  }

  private BarberoDisponibilidadMetricsDTO buildMetrics(Barbero barbero,
                                                        List<BarberoHorarioDTO> horario,
                                                        List<BarberoBloqueoDTO> bloqueos,
                                                        List<BarberoDisponibilidadCitaDTO> citas) {
    long diasActivos = horario.stream()
        .filter(h -> Boolean.TRUE.equals(h.activo()))
        .count();

    double horasSemana = horario.stream()
        .filter(h -> Boolean.TRUE.equals(h.activo()))
        .mapToLong(h -> {
          LocalTime desde = LocalTime.parse(h.desde());
          LocalTime hasta = LocalTime.parse(h.hasta());
          return Duration.between(desde, hasta).toMinutes();
        })
        .sum() / 60d;

    Instant proximaCita = citas.stream()
        .map(BarberoDisponibilidadCitaDTO::inicio)
        .min(Comparator.naturalOrder())
        .orElse(null);

    Instant proximoBloqueo = bloqueos.stream()
        .map(BarberoBloqueoDTO::inicio)
        .min(Comparator.naturalOrder())
        .orElse(null);

    int serviciosActivos = barbero.getServicios() != null ? barbero.getServicios().size() : 0;

    return new BarberoDisponibilidadMetricsDTO(
        (int) diasActivos,
        horasSemana,
        bloqueos.size(),
        citas.size(),
        proximaCita,
        proximoBloqueo,
        serviciosActivos
    );
  }

  private BarberoBloqueoDTO toBloqueoDTO(BarberoBloqueo bloqueo) {
    return new BarberoBloqueoDTO(
        bloqueo.getId(),
        bloqueo.getBarbero() != null ? bloqueo.getBarbero().getId() : null,
        bloqueo.getInicio(),
        bloqueo.getFin(),
        bloqueo.getMotivo()
    );
  }

  private BarberoDisponibilidadCitaDTO toCitaDTO(Cita cita) {
    return new BarberoDisponibilidadCitaDTO(
        cita.getId(),
        cita.getInicio(),
        cita.getFin(),
        cita.getClienteNombre(),
        cita.getServicio() != null ? cita.getServicio().getNombre() : null,
        cita.getEstado() != null ? cita.getEstado().name() : null,
        cita.getOverridePrecioCentavos() != null
            ? cita.getOverridePrecioCentavos()
            : (cita.getServicio() != null ? cita.getServicio().getPrecioCentavos() : null)
    );
  }

  private BarberoServicioResumenDTO toServicioDTO(Servicio servicio) {
    return new BarberoServicioResumenDTO(
        servicio.getId(),
        servicio.getNombre(),
        servicio.getDuracionMin(),
        servicio.getPrecioCentavos()
    );
  }
}
