package com.omnibudget.controller;

import com.omnibudget.domain.TransactionRule;
import com.omnibudget.dto.CreateRuleRequest;
import com.omnibudget.dto.UpdateRuleRequest;
import com.omnibudget.service.RuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
public class RuleController {

    private final RuleService ruleService;

    @GetMapping
    public ResponseEntity<List<TransactionRule>> getRules(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(ruleService.getRules(userId));
    }

    @PostMapping
    public ResponseEntity<TransactionRule> createRule(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody CreateRuleRequest req) {
        if (userId != null && !userId.isBlank()) req.setUserId(userId);
        return ResponseEntity.ok(ruleService.createRule(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionRule> updateRule(
            @PathVariable UUID id,
            @RequestBody UpdateRuleRequest req) {
        return ResponseEntity.ok(ruleService.updateRule(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRule(@PathVariable UUID id) {
        ruleService.deleteRule(id);
        return ResponseEntity.ok(Map.of("message", "Rule deleted successfully", "id", id.toString()));
    }

    @PostMapping("/run-all")
    public ResponseEntity<Map<String, Object>> runRulesOnAll(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(ruleService.runRulesOnAllTransactions(userId));
    }
}
