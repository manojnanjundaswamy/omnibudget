package com.omnibudget.controller;

import com.omnibudget.dto.AnomalyDetectionDto;
import com.omnibudget.dto.CashFlowForecastDto;
import com.omnibudget.dto.FinancialHealthDto;
import com.omnibudget.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/financial-health")
    public ResponseEntity<FinancialHealthDto> getFinancialHealth(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(analyticsService.getFinancialHealth(userId));
    }

    @GetMapping("/forecast")
    public ResponseEntity<CashFlowForecastDto> getCashFlowForecast(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(analyticsService.getCashFlowForecast(userId));
    }

    @GetMapping("/anomalies")
    public ResponseEntity<AnomalyDetectionDto> getAnomalies(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(analyticsService.getAnomalies(userId));
    }
}
