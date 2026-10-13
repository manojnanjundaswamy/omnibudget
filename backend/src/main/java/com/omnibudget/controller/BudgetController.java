package com.omnibudget.controller;

import com.omnibudget.domain.BudgetEnvelope;
import com.omnibudget.dto.CreateEnvelopeRequest;
import com.omnibudget.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping("/envelopes")
    public ResponseEntity<List<BudgetEnvelope>> getEnvelopes() {
        return ResponseEntity.ok(budgetService.getAllEnvelopes());
    }

    @PostMapping("/envelopes")
    public ResponseEntity<BudgetEnvelope> createEnvelope(@RequestBody CreateEnvelopeRequest req) {
        return ResponseEntity.ok(budgetService.createEnvelope(req));
    }

    @PutMapping("/envelopes/{id}")
    public ResponseEntity<BudgetEnvelope> updateBudget(
            @PathVariable UUID id,
            @RequestBody Map<String, BigDecimal> body) {
        BigDecimal budget = body.get("monthlyBudget");
        return ResponseEntity.ok(budgetService.updateBudget(id, budget));
    }

    @PostMapping("/rebalance")
    public ResponseEntity<Map<String, String>> rebalance(
            @RequestParam UUID sourceEnvelopeId,
            @RequestParam UUID targetEnvelopeId,
            @RequestParam BigDecimal amount) {
        budgetService.rebalanceEnvelopes(sourceEnvelopeId, targetEnvelopeId, amount);
        return ResponseEntity.ok(Map.of("message", "Rebalancing completed successfully"));
    }

    @PostMapping("/auto-allocate")
    public ResponseEntity<Map<String, String>> autoAllocate(@RequestBody Map<String, BigDecimal> body) {
        BigDecimal totalIncome = body.get("totalIncome");
        budgetService.autoAllocateIncome(totalIncome);
        return ResponseEntity.ok(Map.of("message", "Income auto-allocated according to target ratios"));
    }
}
