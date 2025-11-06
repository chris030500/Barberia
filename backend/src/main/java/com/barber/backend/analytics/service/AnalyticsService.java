package com.barber.backend.analytics.service;

import com.barber.backend.analytics.dto.ResumenDashboardDTO;
import com.barber.backend.analytics.dto.ResumenDashboardDTO.AdminDashboard;
import com.barber.backend.analytics.dto.ResumenDashboardDTO.BarberoDashboard;
import com.barber.backend.analytics.dto.ResumenDashboardDTO.BarberoProximaCita;
import com.barber.backend.analytics.dto.ResumenDashboardDTO.CitaCliente;
import com.barber.backend.analytics.dto.ResumenDashboardDTO.ClienteDashboard;
import com.barber.backend.analytics.dto.ResumenDashboardDTO.DashboardRole;
import com.barber.backend.barberos.model.Barbero;
import com.barber.backend.barberos.repository.BarberoRepository;
import com.barber.backend.citas.model.Cita;
import com.barber.backend.citas.repository.CitaRepository;
import com.barber.backend.catalogo.repository.ServicioRepository;
import com.barber.backend.login.model.Usuario;
import com.barber.backend.login.repository.UsuarioRepository;
import com.barber.backend.login.security.AppUserPrincipal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {

    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;
    private final BarberoRepository barberoRepository;
    private final ServicioRepository servicioRepository;
    private final ZoneId zoneId = ZoneId.systemDefault();

    public AnalyticsService(
            CitaRepository citaRepository,
            UsuarioRepository usuarioRepository,
            BarberoRepository barberoRepository,
            ServicioRepository servicioRepository) {
        this.citaRepository = citaRepository;
        this.usuarioRepository = usuarioRepository;
        this.barberoRepository = barberoRepository;
        this.servicioRepository = servicioRepository;
    }

    @Transactional(readOnly = true)
    public ResumenDashboardDTO obtenerResumenDashboard(AppUserPrincipal principal) {
        Usuario usuario = resolveUsuario(principal);
        DashboardRole role = resolveRole(principal, usuario);

        LocalDate hoy = LocalDate.now(zoneId);
        Instant ahora = Instant.now();

        AdminDashboard adminSection = role == DashboardRole.ADMIN
                ? buildAdminDashboard(hoy)
                : null;

        BarberoDashboard barberoSection = role == DashboardRole.BARBERO
                ? buildBarberoDashboard(hoy, ahora, resolveBarberoId(principal, usuario))
                : null;

        ClienteDashboard clienteSection = role == DashboardRole.CLIENTE
                ? buildClienteDashboard(ahora, usuario)
                : null;

        return new ResumenDashboardDTO(role, adminSection, barberoSection, clienteSection);
    }

    private AdminDashboard buildAdminDashboard(LocalDate hoy) {
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
        long clientesVerificados = usuarioRepository.countByRolAndTelefonoVerificadoTrue(Usuario.Rol.CLIENTE);
        long nuevosClientesSemana = usuarioRepository.countByRolAndCreadoEnBetween(
                Usuario.Rol.CLIENTE,
                inicioSemanaInstant,
                finSemanaInstant);

        long barberosActivos = barberoRepository.countByActivoTrue();
        long serviciosActivos = servicioRepository.countByActivoTrue();

        long ingresosMes = safeLong(citaRepository.sumIngresosCompletadasBetween(inicioMesInstant, inicioMesSiguienteInstant));
        long ingresosMesAnterior = safeLong(citaRepository.sumIngresosCompletadasBetween(inicioMesAnteriorInstant, inicioMesInstant));
        double variacion = calcularVariacion(ingresosMesAnterior, ingresosMes);

        return new AdminDashboard(
                citasHoy,
                citasSemana,
                canceladasSemana,
                clientesActivos,
                clientesVerificados,
                nuevosClientesSemana,
                barberosActivos,
                serviciosActivos,
                ingresosMes,
                ingresosMesAnterior,
                variacion);
    }

    private BarberoDashboard buildBarberoDashboard(LocalDate hoy, Instant ahora, Long barberoId) {
        if (barberoId == null) {
            return new BarberoDashboard(0, 0, 0, 0, 0, Collections.emptyList());
        }

        Instant inicioDia = hoy.atStartOfDay(zoneId).toInstant();
        Instant finDia = hoy.plusDays(1).atStartOfDay(zoneId).toInstant();

        LocalDate inicioSemana = hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate finSemana = inicioSemana.plusDays(7);
        Instant inicioSemanaInstant = inicioSemana.atStartOfDay(zoneId).toInstant();
        Instant finSemanaInstant = finSemana.atStartOfDay(zoneId).toInstant();

        LocalDate inicioMes = hoy.withDayOfMonth(1);
        LocalDate inicioMesSiguiente = inicioMes.plusMonths(1);
        Instant inicioMesInstant = inicioMes.atStartOfDay(zoneId).toInstant();
        Instant inicioMesSiguienteInstant = inicioMesSiguiente.atStartOfDay(zoneId).toInstant();

        long citasHoy = citaRepository.countByBarberoAndEstadoBetween(barberoId, Cita.Estado.AGENDADA, inicioDia, finDia);
        long citasSemana = citaRepository.countByBarberoAndEstadoBetween(barberoId, Cita.Estado.AGENDADA, inicioSemanaInstant, finSemanaInstant);
        long canceladasSemana = citaRepository.countByBarberoAndEstadoBetween(barberoId, Cita.Estado.CANCELADA, inicioSemanaInstant, finSemanaInstant);
        long completadasMes = citaRepository.countByBarberoAndEstadoBetween(barberoId, Cita.Estado.COMPLETADA, inicioMesInstant, inicioMesSiguienteInstant);
        long ingresosMes = safeLong(citaRepository.sumIngresosCompletadasBarberoBetween(barberoId, inicioMesInstant, inicioMesSiguienteInstant));

        List<BarberoProximaCita> proximas = citaRepository
                .findProximasCitasBarbero(barberoId, ahora, Pageable.ofSize(3))
                .stream()
                .map(c -> new BarberoProximaCita(
                        Optional.ofNullable(c.getId()).orElse(0L),
                        truncate(c.getClienteNombre(), 60),
                        c.getServicio() != null ? c.getServicio().getNombre() : "Servicio",
                        c.getInicio(),
                        c.getFin()))
                .collect(Collectors.toList());

        return new BarberoDashboard(citasHoy, citasSemana, canceladasSemana, completadasMes, ingresosMes, proximas);
    }

    private ClienteDashboard buildClienteDashboard(Instant ahora, Usuario usuario) {
        if (usuario == null) {
            return new ClienteDashboard(false, false, "", 0, 0, null, null);
        }

        String nombre = normalize(usuario.getNombre());
        String telefono = normalize(usuario.getTelefonoE164());
        boolean perfilCompleto = !nombre.isBlank() && !telefono.isBlank();
        boolean telefonoVerificado = usuario.isTelefonoVerificado();
        String preferido = !nombre.isBlank() ? firstToken(nombre) : fallbackNombre(usuario);

        long pendientes = 0L;
        long historicas = 0L;
        CitaCliente proxima = null;
        CitaCliente ultima = null;

        if (!telefono.isBlank()) {
            pendientes = citaRepository.countByClienteTelE164AndEstadoAndInicioAfter(telefono, Cita.Estado.AGENDADA, ahora);
            historicas = citaRepository.countByClienteTelE164AndEstado(telefono, Cita.Estado.COMPLETADA);

            proxima = citaRepository
                    .findProximasCitasCliente(telefono, ahora, Pageable.ofSize(1))
                    .stream()
                    .findFirst()
                    .map(this::toClienteCita)
                    .orElse(null);

            ultima = citaRepository
                    .findUltimasCitasCliente(telefono, Pageable.ofSize(1))
                    .stream()
                    .findFirst()
                    .map(this::toClienteCita)
                    .orElse(null);
        }

        return new ClienteDashboard(perfilCompleto, telefonoVerificado, preferido, pendientes, historicas, proxima, ultima);
    }

    private CitaCliente toClienteCita(Cita cita) {
        if (cita == null) {
            return null;
        }
        String barberoNombre = Optional.ofNullable(cita.getBarbero())
                .map(Barbero::getNombre)
                .filter(Objects::nonNull)
                .filter(n -> !n.isBlank())
                .orElse("Barbero asignado");
        String servicioNombre = cita.getServicio() != null ? cita.getServicio().getNombre() : "Servicio";
        return new CitaCliente(Optional.ofNullable(cita.getId()).orElse(0L), barberoNombre, servicioNombre, cita.getInicio());
    }

    private Usuario resolveUsuario(AppUserPrincipal principal) {
        if (principal == null || principal.getUserId() == null) {
            return null;
        }
        return usuarioRepository.findById(principal.getUserId()).orElse(null);
    }

    private DashboardRole resolveRole(AppUserPrincipal principal, Usuario usuario) {
        if (principal != null) {
            if (principal.hasRole("ADMIN")) {
                return DashboardRole.ADMIN;
            }
            if (principal.hasRole("BARBERO")) {
                return DashboardRole.BARBERO;
            }
        }
        if (usuario != null) {
            if (usuario.isAdmin()) {
                return DashboardRole.ADMIN;
            }
            if (usuario.isBarbero()) {
                return DashboardRole.BARBERO;
            }
        }
        return DashboardRole.CLIENTE;
    }

    private Long resolveBarberoId(AppUserPrincipal principal, Usuario usuario) {
        if (principal != null && principal.getBarberoId() != null) {
            return principal.getBarberoId();
        }
        if (usuario != null && usuario.getBarbero() != null) {
            return usuario.getBarbero().getId();
        }
        return null;
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

    private static String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private static String firstToken(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        int idx = trimmed.indexOf(' ');
        return idx > 0 ? trimmed.substring(0, idx) : trimmed;
    }

    private static String fallbackNombre(Usuario usuario) {
        if (usuario == null) {
            return "";
        }
        if (usuario.getUsername() != null && !usuario.getUsername().isBlank()) {
            return usuario.getUsername();
        }
        if (usuario.getEmail() != null && !usuario.getEmail().isBlank()) {
            return usuario.getEmail();
        }
        return "cliente";
    }

    private static String truncate(String value, int maxLength) {
        String normalized = normalize(value);
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, Math.max(0, maxLength - 1)).trim() + "…";
    }
}
