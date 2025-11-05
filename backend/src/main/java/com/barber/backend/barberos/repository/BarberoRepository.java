// src/main/java/com/barber/backend/barberos/repository/BarberoRepository.java
package com.barber.backend.barberos.repository;

import com.barber.backend.barberos.model.Barbero;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BarberoRepository extends JpaRepository<Barbero, Long> {

  @EntityGraph(attributePaths = "servicios")            // 👈 inicializa colección
  Page<Barbero> findByActivoTrue(Pageable pageable);

  @Override
  @EntityGraph(attributePaths = "servicios")            // 👈 también en findAll(pageable)
  Page<Barbero> findAll(Pageable pageable);
}