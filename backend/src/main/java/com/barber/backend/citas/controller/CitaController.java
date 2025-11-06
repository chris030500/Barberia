package com.barber.backend.citas.controller;

import com.barber.backend.citas.dto.CitaDTO;
import com.barber.backend.citas.dto.CitaSaveRequest;
import com.barber.backend.citas.model.Cita.Estado;
import com.barber.backend.citas.service.CitaService;
import com.barber.backend.login.security.AppUserPrincipal;

import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.barber.backend.login.security.AppUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.time.Instant;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService service;

    public CitaController(CitaService service) {
        this.service = service;
    }

    @GetMapping
    public Page<CitaDTO> list(
            @RequestParam(required = false) Long barberoId,
            @RequestParam(required = false) Estado estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inicio,asc") String sort) {
        // Defaults si no vienen
        Instant now = Instant.now();
        if (desde == null)
            desde = now.minusSeconds(7L * 24 * 3600); // 7 días atrás
        if (hasta == null)
            hasta = now.plusSeconds(30L * 24 * 3600); // 30 días adelante
        if (!desde.isBefore(hasta)) {
            throw new IllegalArgumentException("'desde' debe ser anterior a 'hasta'");
        }

        Sort s = Sort.by(
                sort.contains(",")
                        ? Sort.Order.by(sort.split(",")[0]).with(
                                "desc".equalsIgnoreCase(sort.split(",")[1]) ? Sort.Direction.DESC : Sort.Direction.ASC)
                        : Sort.Order.asc(sort));
        Pageable pageable = PageRequest.of(page, size, s);
        return service.list(barberoId, estado, desde, hasta, pageable);
    }

    @GetMapping("/{id}")
    public CitaDTO get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<CitaDTO> create(
            @Valid @RequestBody CitaSaveRequest in,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(service.create(in, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CitaDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody CitaSaveRequest in,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(service.update(id, in, principal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // === Acciones de estado explícitas ===
    @PostMapping("/{id}/completar")
    public CitaDTO completar(@PathVariable Long id) {
        return service.cambiarEstado(id, Estado.COMPLETADA);
    }

    @PostMapping("/{id}/cancelar")
    public CitaDTO cancelar(@PathVariable Long id) {
        return service.cambiarEstado(id, Estado.CANCELADA);
    }

}