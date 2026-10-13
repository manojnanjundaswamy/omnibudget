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
    public ResponseEntity<List<BudgetEnvelope>> getEnvelopes(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(budgetService.getAllEnvelopes(userId));
    }

    @PostMapping("/envelopes")
    public ResponseEntity<BudgetEnvelope> createEnvelope(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody CreateEnvelopeRequest req) {
        if (userId != null && !userId.isBlank()) req.setUserId(userId);
        return ResponseEntity.ok(budgetService.createEnvelope(req));
    }

    @PutMapping("/envelopes/{id}")
    public ResponseEntity<BudgetEnvelope> updateEnvelope(
            @PathVariable UUID id,
            @RequestBody com.omnibudget.dto.UpdateEnvelopeRequest req) {
        return ResponseEntity.ok(budgetService.updateEnvelope(id, req));
    }

    @DeleteMapping("/envelopes/{id}")
    public ResponseEntity<Map<String, String>> deleteEnvelope(@PathVariable UUID id) {
        budgetService.deleteEnvelope(id);
        return ResponseEntity.ok(Map.of("message", "Envelope deleted successfully"));
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
