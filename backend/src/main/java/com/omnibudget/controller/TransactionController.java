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
    private final com.omnibudget.service.CsvService csvService;

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) UUID envelopeId,
            @RequestParam(required = false) com.omnibudget.domain.TransactionType type,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ledgerService.getFilteredTransactions(userId, accountId, category, envelopeId, type, search));
    }

    @GetMapping(value = "/export-csv", produces = "text/csv")
    public ResponseEntity<String> exportCsv(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        String csvData = csvService.exportTransactionsToCsv(userId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"omnibudget-transactions.csv\"")
                .body(csvData);
    }

    @PostMapping("/import-csv")
    public ResponseEntity<java.util.Map<String, Object>> importCsv(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody String csvContent) {
        java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        return ResponseEntity.ok(csvService.importTransactionsCsv(userId, bais));
    }

    @PostMapping
    public ResponseEntity<Transaction> recordTransaction(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody CreateTransactionRequest req) {
        if (userId != null && !userId.isBlank()) req.setUserId(userId);
        return ResponseEntity.ok(ledgerService.recordTransaction(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(
            @PathVariable UUID id,
            @RequestBody com.omnibudget.dto.UpdateTransactionRequest req) {
        return ResponseEntity.ok(ledgerService.updateTransaction(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, String>> deleteTransaction(@PathVariable UUID id) {
        ledgerService.deleteTransaction(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Transaction deleted and balances reverted successfully"));
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
