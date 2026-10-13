package com.omnibudget.controller;

import com.omnibudget.domain.Account;
import com.omnibudget.dto.CreateAccountRequest;
import com.omnibudget.dto.TransferRequest;
import com.omnibudget.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final LedgerService ledgerService;

    @GetMapping
    public ResponseEntity<List<Account>> getAllAccounts(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(ledgerService.getAllAccounts(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccount(@PathVariable UUID id) {
        return ResponseEntity.ok(ledgerService.getAccountById(id));
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody CreateAccountRequest req) {
        if (userId != null && !userId.isBlank()) req.setUserId(userId);
        return ResponseEntity.ok(ledgerService.createAccount(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> updateAccount(
            @PathVariable UUID id,
            @RequestBody com.omnibudget.dto.UpdateAccountRequest req) {
        return ResponseEntity.ok(ledgerService.updateAccount(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAccount(@PathVariable UUID id) {
        ledgerService.deleteAccount(id);
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }

    @PostMapping("/transfer")
    public ResponseEntity<Map<String, String>> transfer(@RequestBody TransferRequest req) {
        ledgerService.executeTransfer(req);
        return ResponseEntity.ok(Map.of("message", "Transfer executed successfully"));
    }
}
