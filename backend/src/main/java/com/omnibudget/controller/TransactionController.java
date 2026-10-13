package com.omnibudget.controller;

import com.omnibudget.domain.Transaction;
import com.omnibudget.dto.CreateTransactionRequest;
import com.omnibudget.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final LedgerService ledgerService;

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(ledgerService.getAllTransactions());
    }

    @PostMapping
    public ResponseEntity<Transaction> recordTransaction(@RequestBody CreateTransactionRequest req) {
        return ResponseEntity.ok(ledgerService.recordTransaction(req));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<Transaction>> getTransactionsByAccount(@PathVariable UUID accountId) {
        return ResponseEntity.ok(ledgerService.getTransactionsByAccount(accountId));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Transaction>> getTransactionsByGroup(@PathVariable UUID groupId) {
        return ResponseEntity.ok(ledgerService.getTransactionsByGroup(groupId));
    }
}
