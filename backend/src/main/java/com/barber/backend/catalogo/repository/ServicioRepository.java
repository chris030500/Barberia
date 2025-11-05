package com.barber.backend.catalogo.repository;

import com.barber.backend.catalogo.model.Servicio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServicioRepository extends JpaRepository<Servicio, Long> {
  Page<Servicio> findByActivoTrue(Pageable pageable);
  boolean existsByNombreIgnoreCase(String nombre);
}