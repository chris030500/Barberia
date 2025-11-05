package com.barber.backend.barberos.controller;

import com.barber.backend.barberos.dto.BarberoDTO;
import com.barber.backend.barberos.dto.BarberoSaveRequest;
import com.barber.backend.barberos.service.BarberoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/barberos")
public class BarberoController {

  private final BarberoService service;

  public BarberoController(BarberoService service) {
    this.service = service;
  }

  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public Page<BarberoDTO> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) Boolean soloActivos
  ) {
    Pageable pageable = PageRequest.of(page, size);
    return service.list(pageable, soloActivos);
  }

  @GetMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public BarberoDTO get(@PathVariable Long id) {
    return service.get(id);
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public ResponseEntity<BarberoDTO> create(@Valid @RequestBody BarberoSaveRequest in) {
    return ResponseEntity.ok(service.create(in));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public ResponseEntity<BarberoDTO> update(@PathVariable Long id, @Valid @RequestBody BarberoSaveRequest in) {
    return ResponseEntity.ok(service.update(id, in));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }
}