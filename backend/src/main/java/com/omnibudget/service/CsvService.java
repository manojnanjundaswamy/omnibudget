package com.omnibudget.service;

import com.omnibudget.domain.*;
import com.omnibudget.dto.CreateTransactionRequest;
import com.omnibudget.repository.AccountRepository;
import com.omnibudget.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final LedgerService ledgerService;
    private final RuleService ruleService;

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("M/d/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("d/M/yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),
            DateTimeFormatter.ofPattern("yyyy.MM.dd")
    );

    public String exportTransactionsToCsv(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc(effectiveUserId);

        StringWriter sw = new StringWriter();
        try (CSVPrinter printer = new CSVPrinter(sw, CSVFormat.DEFAULT.builder()
                .setHeader("Date", "Description", "Merchant", "Category", "Amount", "Type", "Account", "Status")
                .build())) {

            for (Transaction tx : transactions) {
                printer.printRecord(
                        tx.getDate() != null ? tx.getDate().toString() : "",
                        tx.getDescription() != null ? tx.getDescription() : "",
                        tx.getMerchant() != null ? tx.getMerchant() : "",
                        tx.getCategory() != null ? tx.getCategory() : "Uncategorized",
                        tx.getAmount() != null ? tx.getAmount().toPlainString() : "0.00",
                        tx.getType() != null ? tx.getType().name() : "EXPENSE",
                        tx.getAccountName() != null ? tx.getAccountName() : "Primary Account",
                        tx.getStatus() != null ? tx.getStatus().name() : "CLEARED"
                );
            }
        } catch (IOException e) {
            log.error("Error generating CSV export", e);
            throw new RuntimeException("Failed to generate CSV", e);
        }

        return sw.toString();
    }

    @Transactional
    public Map<String, Object> importTransactionsCsv(String userId, InputStream inputStream) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";

        // Find primary account fallback
        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc(effectiveUserId);
        Account defaultAccount = accounts.isEmpty() ? null : accounts.get(0);
        if (defaultAccount == null) {
            defaultAccount = accountRepository.save(Account.builder()
                    .userId(effectiveUserId)
                    .name("Primary Checking")
                    .type(AccountType.CHECKING)
                    .balance(BigDecimal.valueOf(5000))
                    .currency("USD")
                    .institutionName("OmniBudget Bank")
                    .isActive(true)
                    .build());
        }

        int importedCount = 0;
        int skippedCount = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord record : parser) {
                try {
                    String dateStr = getHeaderValue(record, "Date", "Transaction Date", "Posted Date");
                    String descStr = getHeaderValue(record, "Description", "Name", "Payee", "Memo");
                    String merchantStr = getHeaderValue(record, "Merchant", "Payee", "Description");
                    String catStr = getHeaderValue(record, "Category", "Category Name");
                    String amountStr = getHeaderValue(record, "Amount", "Total", "Debit", "Credit");

                    if (amountStr == null || amountStr.isBlank()) {
                        skippedCount++;
                        continue;
                    }

                    // Clean amount string (e.g. $1,234.56 or (50.00))
                    amountStr = amountStr.replace("$", "").replace(",", "").trim();
                    boolean isParenthesisNegative = amountStr.startsWith("(") && amountStr.endsWith(")");
                    if (isParenthesisNegative) {
                        amountStr = "-" + amountStr.substring(1, amountStr.length() - 1);
                    }

                    BigDecimal amount = new BigDecimal(amountStr);
                    LocalDate date = parseDate(dateStr);

                    TransactionType type = amount.compareTo(BigDecimal.ZERO) >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
                    if (catStr == null || catStr.isBlank()) {
                        catStr = "General";
                    }

                    CreateTransactionRequest req = new CreateTransactionRequest();
                    req.setUserId(effectiveUserId);
                    req.setAccountId(defaultAccount.getId());
                    req.setAmount(amount.abs());
                    req.setType(type);
                    req.setCategory(catStr);
                    req.setDescription(descStr != null ? descStr : "Imported Transaction");
                    req.setMerchant(merchantStr != null ? merchantStr : descStr);
                    req.setDate(date);

                    Transaction created = ledgerService.recordTransaction(req);
                    // Apply user rules
                    ruleService.applyRulesToTransaction(created, effectiveUserId);
                    transactionRepository.save(created);

                    importedCount++;
                } catch (Exception ex) {
                    skippedCount++;
                    errors.add("Row " + record.getRecordNumber() + ": " + ex.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse CSV upload", e);
            throw new RuntimeException("CSV import error: " + e.getMessage(), e);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("importedCount", importedCount);
        result.put("skippedCount", skippedCount);
        result.put("errors", errors);
        return result;
    }

    private String getHeaderValue(CSVRecord record, String... possibleHeaders) {
        for (String h : possibleHeaders) {
            if (record.isMapped(h)) {
                String val = record.get(h);
                if (val != null && !val.isBlank()) return val;
            }
        }
        return null;
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateStr.trim(), fmt);
            } catch (DateTimeParseException ignored) {}
        }
        return LocalDate.now();
    }
}
