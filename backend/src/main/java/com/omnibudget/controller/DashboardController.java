package com.omnibudget.controller;

import com.omnibudget.dto.DashboardSummaryResponse;
import com.omnibudget.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final LedgerService ledgerService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary(
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(ledgerService.getDashboardSummary(userId));
    }
}
