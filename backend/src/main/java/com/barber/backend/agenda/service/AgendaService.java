// src/main/java/com/barber/backend/agenda/service/AgendaService.java
package com.barber.backend.agenda.service;

import com.barber.backend.agenda.config.AgendaProperties;
import com.barber.backend.agenda.dto.SlotDTO;
import com.barber.backend.agenda.dto.SlotsRequest;
import com.barber.backend.agenda.dto.SlotsResponse;
import com.barber.backend.agenda.model.BarberoBloqueo;
import com.barber.backend.agenda.model.BarberoHorarioSemanal;
import com.barber.backend.agenda.repository.BarberoBloqueoRepository;
import com.barber.backend.agenda.repository.BarberoHorarioSemanalRepository;
import com.barber.backend.barberos.repository.BarberoRepository;
import com.barber.backend.catalogo.model.Servicio;
import com.barber.backend.catalogo.repository.ServicioRepository;
import com.barber.backend.citas.model.Cita;
import com.barber.backend.citas.model.Cita.Estado;
import com.barber.backend.citas.repository.CitaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class AgendaService {

  private final AgendaProperties props;
  private final CitaRepository citaRepo;
  private final BarberoRepository barberoRepo;
  private final ServicioRepository servicioRepo;
  private final BarberoHorarioSemanalRepository horarioRepo;
  private final BarberoBloqueoRepository bloqueoRepo;

  private static final DateTimeFormatter YYYY_MM_DD = DateTimeFormatter.ISO_LOCAL_DATE;

  public AgendaService(AgendaProperties props,
                       CitaRepository citaRepo,
                       BarberoRepository barberoRepo,
                       ServicioRepository servicioRepo,
                       BarberoHorarioSemanalRepository horarioRepo,
                       BarberoBloqueoRepository bloqueoRepo) {
    this.props = props;
    this.citaRepo = citaRepo;
    this.barberoRepo = barberoRepo;
    this.servicioRepo = servicioRepo;
    this.horarioRepo = horarioRepo;
    this.bloqueoRepo = bloqueoRepo;
  }

  public SlotsResponse getSlots(SlotsRequest r) {
    if (r.barberoId() == null) throw new IllegalArgumentException("barberoId es requerido");
    if (r.servicioId() == null) throw new IllegalArgumentException("servicioId es requerido");
    if (r.fecha() == null || r.fecha().isBlank()) throw new IllegalArgumentException("fecha es requerida (yyyy-MM-dd)");

    // timezone desde properties
    final ZoneId tz = ZoneId.of(props.getTimezone().trim());

    // validaciones de existencia
    barberoRepo.findById(r.barberoId())
        .orElseThrow(() -> new EntityNotFoundException("Barbero no encontrado"));
    final Servicio servicio = servicioRepo.findById(r.servicioId())
        .orElseThrow(() -> new EntityNotFoundException("Servicio no encontrado"));

    // duración efectiva del servicio
    int duracionMin = (r.duracionMin() != null && r.duracionMin() > 0)
        ? r.duracionMin()
        : (servicio.getDuracionMin() != null ? servicio.getDuracionMin() : 0);
    if (duracionMin <= 0) duracionMin = 15;

    // tamaño de slot efectivo
    int slotSizeMin = (r.slotSizeMin() != null && r.slotSizeMin() > 0)
        ? r.slotSizeMin()
        : props.getSlotSizeMin();

    // fecha objetivo y horizonte (anticipación mínima y máxima)
    final LocalDate ld = LocalDate.parse(r.fecha(), YYYY_MM_DD);
    final Instant now = Instant.now();
    final Instant minStart = now.plus(Duration.ofMinutes(props.getMinAdvanceMin()));
    final Instant maxStart = now.plus(Duration.ofDays(props.getMaxAdvanceDays()));

    // rango UTC del día en zona local
    final Instant startOfDayUtc = ld.atStartOfDay(tz).toInstant();
    final Instant endOfDayUtc   = ld.plusDays(1).atStartOfDay(tz).minusNanos(1).toInstant();

    // 1) Ventanas base: horario semanal activo del barbero para el DOW del día
    //    Tu DOW es 0=domingo … 6=sábado; java = 1=lun … 7=dom → mapeo: (javaDow % 7)
    int javaDow = ld.getDayOfWeek().getValue(); // 1..7
    int myDow = javaDow % 7;                    // 0..6 (0=domingo)
    List<BarberoHorarioSemanal> franjas =
    horarioRepo.findByBarbero_IdAndDowAndActivoTrue(r.barberoId(), Integer.valueOf(myDow));

    List<Window> ventanas = new ArrayList<>();
    for (BarberoHorarioSemanal h : franjas) {
      // convierte LocalTime del horario a instantes concretos en la fecha
      Instant ini = ZonedDateTime.of(ld, h.getDesde(), tz).toInstant();
      Instant fin = ZonedDateTime.of(ld, h.getHasta(), tz).toInstant();
      if (fin.isAfter(ini)) {
        ventanas.add(new Window(ini, fin));
      }
    }
    // si no hay horario ese día → no hay slots
    if (ventanas.isEmpty()) {
      return new SlotsResponse(r.barberoId(), r.servicioId(), r.fecha(), slotSizeMin, duracionMin, List.of());
    }

    // 2) Restar bloqueos del barbero que crucen el día
    List<BarberoBloqueo> bloqueos = bloqueoRepo.findByBarberoIdAndInicioLessThanAndFinGreaterThan(
        r.barberoId(), endOfDayUtc, startOfDayUtc);
    ventanas = restarVentanas(ventanas, bloqueos.stream()
        .map(b -> new Window(b.getInicio(), b.getFin()))
        .toList());

    // 3) Restar citas AGENDADA que crucen el día
    List<Cita> citasDia = citaRepo.findAgendadasDelBarberoEnRango(r.barberoId(), startOfDayUtc, endOfDayUtc);
    ventanas = restarVentanas(ventanas, citasDia.stream()
        .map(c -> new Window(c.getInicio(), c.getFin()))
        .toList());

    // 4) Aplicar anticipo mínimo y horizonte máximo (sobre el inicio del slot)
    ventanas = aplicarAnticipos(ventanas, minStart, maxStart);

    // 5) Aplicar buffer a ambos lados de cada ventana (para preparar/limpiar)
    int bufferMin = props.getBufferBetweenMin();
    ventanas = aplicarBuffer(ventanas, bufferMin);

    // 6) Generar slots alineados a slotSizeMin y quepan duracionMin completa
    List<SlotDTO> slots = generarSlots(ventanas, tz, slotSizeMin, duracionMin);

    return new SlotsResponse(r.barberoId(), r.servicioId(), r.fecha(), slotSizeMin, duracionMin, slots);
  }

  // ===== Helpers =====

  /** Una ventana de disponibilidad [inicio, fin). */
  private record Window(Instant inicio, Instant fin) {}

  /** Resta de ventanas (base - restas). */
  private List<Window> restarVentanas(List<Window> base, List<Window> restas) {
    List<Window> result = new ArrayList<>(base);
    for (Window r : restas) {
      List<Window> next = new ArrayList<>();
      for (Window w : result) {
        // Sin intersección
        if (r.fin().isBefore(w.inicio()) || r.inicio().isAfter(w.fin())) {
          next.add(w);
          continue;
        }
        // Particiones
        if (r.inicio().isAfter(w.inicio())) next.add(new Window(w.inicio(), r.inicio()));
        if (r.fin().isBefore(w.fin()))     next.add(new Window(r.fin(), w.fin()));
      }
      result = next.stream().filter(x -> x.inicio().isBefore(x.fin())).toList();
    }
    return result;
  }

  /** Recorta ventanas por anticipo mínimo y horizonte máximo. */
  private List<Window> aplicarAnticipos(List<Window> ventanas, Instant minStart, Instant maxStart) {
    List<Window> out = new ArrayList<>();
    for (Window w : ventanas) {
      Instant ini = w.inicio();
      Instant fin = w.fin();

      // si todo el bloque queda antes del anticipo, descartar
      if (!fin.isAfter(minStart)) continue;
      // si todo el bloque queda después del horizonte, descartar
      if (!ini.isBefore(maxStart)) continue;

      Instant recIni = ini.isBefore(minStart) ? minStart : ini;
      Instant recFin = fin.isAfter(maxStart) ? maxStart : fin;
      if (recIni.isBefore(recFin)) out.add(new Window(recIni, recFin));
    }
    return out;
  }

  /** Aplica un buffer a ambos extremos de las ventanas. */
  private List<Window> aplicarBuffer(List<Window> ventanas, int bufferMin) {
    long bsec = bufferMin * 60L;
    return ventanas.stream()
        .map(w -> new Window(w.inicio().plusSeconds(bsec), w.fin().minusSeconds(bsec)))
        .filter(w -> w.inicio().isBefore(w.fin()))
        .toList();
  }

  /** Genera slots alineados a slotSizeMin y que quepan duracionMin. */
  private List<SlotDTO> generarSlots(List<Window> ventanas, ZoneId tz, int slotSizeMin, int duracionMin) {
    List<SlotDTO> out = new ArrayList<>();
    for (Window w : ventanas) {
      Instant cursor = alignTo(w.inicio(), tz, slotSizeMin);
      Instant lastPossibleStart = w.fin().minusSeconds(duracionMin * 60L);
      while (!cursor.isAfter(lastPossibleStart)) {
        Instant sStart = cursor;
        Instant sEnd = cursor.plusSeconds(duracionMin * 60L);
        out.add(new SlotDTO(sStart, sEnd));
        cursor = cursor.plusSeconds(slotSizeMin * 60L);
      }
    }
    return out;
  }

  /** Alinea un instante al siguiente múltiplo de N minutos según su zona. */
  private Instant alignTo(Instant instant, ZoneId tz, int minutes) {
    var zdt = instant.atZone(tz);
    int m = zdt.getMinute();
    int mod = m % minutes;
    if (mod == 0 && zdt.getSecond() == 0 && zdt.getNano() == 0) return instant;

    var next = zdt.withSecond(0).withNano(0)
        .plusMinutes(mod == 0 ? 0 : (minutes - mod));
    return next.toInstant();
  }
}