// src/main/java/com/barber/backend/agenda/controller/AgendaController.java
package com.barber.backend.agenda.controller;

import com.barber.backend.agenda.dto.SlotsRequest;
import com.barber.backend.agenda.dto.SlotsResponse;
import com.barber.backend.agenda.service.AgendaService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

// Habilita CORS si tu front corre en otro dominio/puerto
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
@RestController
@RequestMapping(value = "/api/agenda", produces = MediaType.APPLICATION_JSON_VALUE)
public class AgendaController {

  private final AgendaService svc;

  public AgendaController(AgendaService svc) {
    this.svc = svc;
  }

  @PostMapping(value = "/slots", consumes = MediaType.APPLICATION_JSON_VALUE)
  public SlotsResponse slots(@Valid @RequestBody SlotsRequest req) {
    return svc.getSlots(req);
  }
}