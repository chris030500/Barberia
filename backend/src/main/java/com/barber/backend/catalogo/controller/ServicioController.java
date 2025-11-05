package com.barber.backend.catalogo.controller;

import com.barber.backend.catalogo.dto.*;
import com.barber.backend.catalogo.service.ServicioService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

  private final ServicioService servicio;
  public ServicioController(ServicioService servicio) { this.servicio = servicio; }

  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public Page<ServicioDTO> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "nombre,asc") String sort,
      @RequestParam(required = false) Boolean soloActivos
  ) {
    String[] sp = sort.split(",", 2);
    Pageable pb = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sp.length>1?sp[1]:"asc"), sp[0]));
    return servicio.list(pb, soloActivos);
  }

  @GetMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ServicioDTO get(@PathVariable Long id) { return servicio.get(id); }

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public ResponseEntity<ServicioDTO> create(@Valid @RequestBody ServicioCreateReq req) {
    return ResponseEntity.ok(servicio.create(req));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public ServicioDTO update(@PathVariable Long id, @Valid @RequestBody ServicioUpdateReq req) {
    return servicio.update(id, req);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    servicio.delete(id);
    return ResponseEntity.noContent().build();
  }
}