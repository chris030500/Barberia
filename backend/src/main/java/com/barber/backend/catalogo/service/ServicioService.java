package com.barber.backend.catalogo.service;

import com.barber.backend.catalogo.dto.*;
import com.barber.backend.catalogo.model.Servicio;
import com.barber.backend.catalogo.repository.ServicioRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServicioService {
  private final ServicioRepository repo;

  public ServicioService(ServicioRepository repo) { this.repo = repo; }

  private static ServicioDTO toDTO(Servicio s) {
    return new ServicioDTO(
        s.getId(), s.getNombre(), s.getDescripcion(),
        s.getDuracionMin(), s.getPrecioCentavos(), s.isActivo()
    );
  }

  @Transactional(readOnly = true)
  public Page<ServicioDTO> list(Pageable pageable, Boolean soloActivos) {
    Page<Servicio> page = (soloActivos != null && soloActivos)
        ? repo.findByActivoTrue(pageable)
        : repo.findAll(pageable);
    return page.map(ServicioService::toDTO);
  }

  @Transactional
  public ServicioDTO create(ServicioCreateReq req) {
    if (repo.existsByNombreIgnoreCase(req.nombre()))
      throw new IllegalArgumentException("El nombre de servicio ya existe.");
    Servicio s = new Servicio();
    s.setNombre(req.nombre());
    s.setDescripcion(req.descripcion());
    s.setDuracionMin(req.duracionMin());
    s.setPrecioCentavos(req.precioCentavos());
    s.setActivo(req.activo() == null ? true : req.activo());
    return toDTO(repo.save(s));
  }

  @Transactional
  public ServicioDTO update(Long id, ServicioUpdateReq req) {
    Servicio s = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Servicio no encontrado"));
    if (!s.getNombre().equalsIgnoreCase(req.nombre()) && repo.existsByNombreIgnoreCase(req.nombre()))
      throw new IllegalArgumentException("El nombre de servicio ya existe.");
    s.setNombre(req.nombre());
    s.setDescripcion(req.descripcion());
    s.setDuracionMin(req.duracionMin());
    s.setPrecioCentavos(req.precioCentavos());
    s.setActivo(req.activo());
    return toDTO(s);
  }

  @Transactional
  public void delete(Long id) {
    if (!repo.existsById(id)) return;
    repo.deleteById(id);
  }

  @Transactional(readOnly = true)
  public ServicioDTO get(Long id) {
    Servicio s = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Servicio no encontrado"));
    return toDTO(s);
  }
}