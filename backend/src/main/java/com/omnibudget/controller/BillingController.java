package com.omnibudget.controller;

import com.omnibudget.dto.BillingPlanDto;
import com.omnibudget.dto.SubscriptionSummaryDto;
import com.omnibudget.dto.UpgradePlanRequest;
import com.omnibudget.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/plans")
    public ResponseEntity<List<BillingPlanDto>> getPlansCatalog() {
        return ResponseEntity.ok(billingService.getPlansCatalog());
    }

    @GetMapping("/subscription")
    public ResponseEntity<SubscriptionSummaryDto> getSubscriptionSummary(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(billingService.getSubscriptionSummary(userId));
    }

    @PostMapping("/upgrade")
    public ResponseEntity<SubscriptionSummaryDto> upgradePlan(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody UpgradePlanRequest req) {
        return ResponseEntity.ok(billingService.upgradePlan(userId, req));
    }
}
