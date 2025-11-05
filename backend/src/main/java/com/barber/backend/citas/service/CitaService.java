package com.barber.backend.citas.service;

import com.barber.backend.barberos.model.Barbero;
import com.barber.backend.barberos.repository.BarberoRepository;
import com.barber.backend.citas.dto.CitaDTO;
import com.barber.backend.citas.dto.CitaSaveRequest;
import com.barber.backend.citas.model.Cita;
import com.barber.backend.citas.model.Cita.Estado;
import com.barber.backend.citas.repository.CitaRepository;
import com.barber.backend.catalogo.model.Servicio;
import com.barber.backend.catalogo.repository.ServicioRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class CitaService {

    private final CitaRepository repo;
    private final BarberoRepository barberoRepo;
    private final ServicioRepository servicioRepo;

    public CitaService(CitaRepository repo, BarberoRepository barberoRepo, ServicioRepository servicioRepo) {
        this.repo = repo;
        this.barberoRepo = barberoRepo;
        this.servicioRepo = servicioRepo;
    }

    public Page<CitaDTO> list(Long barberoId, Estado estado, Instant desde, Instant hasta, Pageable pageable) {
        if (desde == null || hasta == null) {
            throw new IllegalArgumentException("Parámetros 'desde' y 'hasta' son requeridos");
        }
        if (!desde.isBefore(hasta)) {
            throw new IllegalArgumentException("'desde' debe ser anterior a 'hasta'");
        }
        return repo.findByFiltro(barberoId, estado, desde, hasta, pageable).map(this::toDTO);
    }

    public CitaDTO get(Long id) {
        return repo.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada"));
    }

    @Transactional
    public CitaDTO create(CitaSaveRequest in) {
        Barbero barbero = barberoRepo.findById(in.barberoId())
                .orElseThrow(() -> new EntityNotFoundException("Barbero no encontrado"));
        Servicio servicio = servicioRepo.findById(in.servicioId())
                .orElseThrow(() -> new EntityNotFoundException("Servicio no encontrado"));

        Cita c = new Cita();
        c.setBarbero(barbero);
        c.setServicio(servicio);
        c.setClienteNombre(in.clienteNombre());
        c.setClienteTelE164(in.clienteTelE164());
        c.setInicio(in.inicio());
        c.setEstado(Cita.Estado.AGENDADA);
        c.setOverrideDuracionMin(in.overrideDuracionMin());
        c.setOverridePrecioCentavos(in.overridePrecioCentavos());
        c.setNotas(in.notas());

        // Calcular fin para validar solape
        int durMin = (in.overrideDuracionMin() != null && in.overrideDuracionMin() > 0)
                ? in.overrideDuracionMin()
                : (servicio.getDuracionMin() != null ? servicio.getDuracionMin() : 0);
        if (durMin <= 0) durMin = 1;
        Instant fin = in.inicio().plusSeconds(durMin * 60L);

        long overlaps = repo.countOverlaps(barbero.getId(), in.inicio(), fin);
        if (overlaps > 0) {
            throw new IllegalStateException("El barbero ya tiene una cita en ese horario");
        }

        Cita saved = repo.save(c);
        return toDTO(saved);
    }

    @Transactional
    public CitaDTO update(Long id, CitaSaveRequest in) {
        Cita c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada"));

        Barbero barbero = barberoRepo.findById(in.barberoId())
                .orElseThrow(() -> new EntityNotFoundException("Barbero no encontrado"));
        Servicio servicio = servicioRepo.findById(in.servicioId())
                .orElseThrow(() -> new EntityNotFoundException("Servicio no encontrado"));

        c.setBarbero(barbero);
        c.setServicio(servicio);
        c.setClienteNombre(in.clienteNombre());
        c.setClienteTelE164(in.clienteTelE164());
        c.setInicio(in.inicio());
        c.setOverrideDuracionMin(in.overrideDuracionMin());
        c.setOverridePrecioCentavos(in.overridePrecioCentavos());
        c.setNotas(in.notas());

        // Recalcular fin para validar solape
        int durMin = (in.overrideDuracionMin() != null && in.overrideDuracionMin() > 0)
                ? in.overrideDuracionMin()
                : (servicio.getDuracionMin() != null ? servicio.getDuracionMin() : 0);
        if (durMin <= 0) durMin = 1;
        Instant fin = in.inicio().plusSeconds(durMin * 60L);

        // Usar query que excluye la misma cita
        long overlaps = repo.countOverlapsExcludingId(barbero.getId(), in.inicio(), fin, id);
        if (overlaps > 0) {
            throw new IllegalStateException("El barbero ya tiene una cita en ese horario");
        }

        Cita saved = repo.save(c);
        return toDTO(saved);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    public CitaDTO cambiarEstado(Long id, Estado nuevo) {
        Cita c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada"));
        if (c.getEstado() == Estado.CANCELADA || c.getEstado() == Estado.COMPLETADA) {
            throw new IllegalStateException("La cita ya está cerrada");
        }
        if (nuevo == Estado.AGENDADA) {
            throw new IllegalArgumentException("Transición inválida");
        }
        c.setEstado(nuevo);
        c.setActualizadoEn(Instant.now());
        return toDTO(repo.save(c));
    }

    private CitaDTO toDTO(Cita c) {
        return new CitaDTO(
                c.getId(),
                (c.getBarbero() != null ? c.getBarbero().getId() : null),
                (c.getServicio() != null ? c.getServicio().getId() : null),
                c.getClienteNombre(),
                c.getClienteTelE164(),
                c.getInicio(),
                c.getFin(),
                c.getEstado(),
                c.getOverrideDuracionMin(),
                c.getOverridePrecioCentavos(),
                c.getNotas(),
                c.getCreadoEn(),
                c.getActualizadoEn()
        );
    }
}