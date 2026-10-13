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
    public ResponseEntity<List<Account>> getAllAccounts() {
        return ResponseEntity.ok(ledgerService.getAllAccounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccount(@PathVariable UUID id) {
        return ResponseEntity.ok(ledgerService.getAccountById(id));
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody CreateAccountRequest req) {
        return ResponseEntity.ok(ledgerService.createAccount(req));
    }

    @PostMapping("/transfer")
    public ResponseEntity<Map<String, String>> transfer(@RequestBody TransferRequest req) {
        ledgerService.executeTransfer(req);
        return ResponseEntity.ok(Map.of("message", "Transfer executed successfully"));
    }
}
