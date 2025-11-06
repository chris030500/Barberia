package com.barber.backend.analytics.service;

import com.barber.backend.analytics.dto.ResumenDashboardDTO;
import com.barber.backend.barberos.repository.BarberoRepository;
import com.barber.backend.citas.model.Cita;
import com.barber.backend.citas.repository.CitaRepository;
import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;
    private final BarberoRepository barberoRepository;
    private final ZoneId zoneId = ZoneId.systemDefault();

    public AnalyticsService(
            CitaRepository citaRepository,
            UsuarioRepository usuarioRepository,
            BarberoRepository barberoRepository) {
        this.citaRepository = citaRepository;
        this.usuarioRepository = usuarioRepository;
        this.barberoRepository = barberoRepository;
    }

    public ResumenDashboardDTO obtenerResumenDashboard() {
        LocalDate hoy = LocalDate.now(zoneId);

        Instant inicioDia = hoy.atStartOfDay(zoneId).toInstant();
        Instant finDia = hoy.plusDays(1).atStartOfDay(zoneId).toInstant();

        LocalDate inicioSemana = hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate finSemana = inicioSemana.plusDays(7);
        Instant inicioSemanaInstant = inicioSemana.atStartOfDay(zoneId).toInstant();
        Instant finSemanaInstant = finSemana.atStartOfDay(zoneId).toInstant();

        LocalDate inicioMes = hoy.withDayOfMonth(1);
        LocalDate inicioMesSiguiente = inicioMes.plusMonths(1);
        LocalDate inicioMesAnterior = inicioMes.minusMonths(1);

        Instant inicioMesInstant = inicioMes.atStartOfDay(zoneId).toInstant();
        Instant inicioMesSiguienteInstant = inicioMesSiguiente.atStartOfDay(zoneId).toInstant();
        Instant inicioMesAnteriorInstant = inicioMesAnterior.atStartOfDay(zoneId).toInstant();

        long citasHoy = citaRepository.countByEstadoBetween(Cita.Estado.AGENDADA, inicioDia, finDia);
        long citasSemana = citaRepository.countByEstadoBetween(Cita.Estado.AGENDADA, inicioSemanaInstant, finSemanaInstant);
        long canceladasSemana = citaRepository.countByEstadoBetween(Cita.Estado.CANCELADA, inicioSemanaInstant, finSemanaInstant);

        long clientesActivos = usuarioRepository.countByRolAndActivoTrue(Usuario.Rol.CLIENTE);
        long barberosActivos = barberoRepository.countByActivoTrue();

        long ingresosMes = safeLong(citaRepository.sumIngresosCompletadasBetween(inicioMesInstant, inicioMesSiguienteInstant));
        long ingresosMesAnterior = safeLong(citaRepository.sumIngresosCompletadasBetween(inicioMesAnteriorInstant, inicioMesInstant));
        double variacion = calcularVariacion(ingresosMesAnterior, ingresosMes);

        return new ResumenDashboardDTO(
                citasHoy,
                citasSemana,
                canceladasSemana,
                clientesActivos,
                barberosActivos,
                ingresosMes,
                ingresosMesAnterior,
                variacion);
    }

    private static long safeLong(Long value) {
        return value != null ? value : 0L;
    }

    private static double calcularVariacion(long base, long actual) {
        if (base == 0L) {
            return actual > 0L ? 100d : 0d;
        }
        double delta = actual - base;
        return (delta / base) * 100d;
    }
}
