package com.barber.backend.analytics.controller;

import com.barber.backend.analytics.dto.ResumenDashboardDTO;
import com.barber.backend.analytics.service.AnalyticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/resumen")
    public ResumenDashboardDTO resumen() {
        return analyticsService.obtenerResumenDashboard();
    }
}
