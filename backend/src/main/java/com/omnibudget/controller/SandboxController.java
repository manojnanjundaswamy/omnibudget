package com.omnibudget.controller;

import com.omnibudget.domain.Transaction;
import com.omnibudget.service.SandboxDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/sandbox")
@RequiredArgsConstructor
public class SandboxController {

    private final SandboxDataService sandboxDataService;

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetToDemo() {
        sandboxDataService.resetToDemoData();
        return ResponseEntity.ok(Map.of("message", "Sandbox demo data reset successfully"));
    }

    @PostMapping("/simulate-paycheck")
    public ResponseEntity<Transaction> simulatePaycheck() {
        return ResponseEntity.ok(sandboxDataService.simulatePaycheck());
    }

    @PostMapping("/simulate-expense")
    public ResponseEntity<Transaction> simulateExpense() {
        return ResponseEntity.ok(sandboxDataService.simulateRandomExpense());
    }
}
