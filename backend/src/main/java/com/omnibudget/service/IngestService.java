package com.omnibudget.service;

import com.omnibudget.domain.*;
import com.omnibudget.dto.CreateTransactionRequest;
import com.omnibudget.dto.ParsedTransactionDto;
import com.omnibudget.dto.SmartClipRequest;
import com.omnibudget.repository.AccountRepository;
import com.omnibudget.repository.TransactionRepository;
import com.omnibudget.repository.TransactionRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class IngestService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionRuleRepository ruleRepository;
    private final LedgerService ledgerService;
    private final RuleService ruleService;

    // Date Pattern heuristics
    private static final Pattern DATE_PATTERN = Pattern.compile(
            "\\b(\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?)\\b|" +
            "\\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+\\d{1,2}(?:,?\\s+\\d{4})?)\\b",
            Pattern.CASE_INSENSITIVE
    );

    // Amount Pattern heuristics (handles $45.20, -$45.20, ($45.20), +1200.00)
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "([+\\-]?\\$?\\s?\\(?\\d{1,3}(?:,\\d{3})*\\.\\d{2}\\)?)"
    );

    // Smart clip notification patterns
    private static final Pattern CLIP_SPENT_PATTERN = Pattern.compile(
            "(?:spent|paid|charged|purchase of)\\s+\\$?([\\d,]+\\.\\d{2})\\s+(?:at|to|for)\\s+([A-Za-z0-9\\s'&.-]+?)(?:\\s+(?:on|with|card|ending|ref|at\\s+\\d|\\.|$))",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern CLIP_INCOME_PATTERN = Pattern.compile(
            "(?:received|deposit of|credited|refund of)\\s+\\$?([\\d,]+\\.\\d{2})\\s+(?:from)\\s+([A-Za-z0-9\\s'&.-]+?)(?:\\s+(?:on|into|card|ending|ref|\\.|$))",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern CARD_LAST4_PATTERN = Pattern.compile(
            "(?:ending\\s+in|card\\s+ending|\\*|x{2,4})\\s*(\\d{4})",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * 1. Universal Bank Statement Text / PDF Ingestion Parser
     */
    public List<ParsedTransactionDto> parseStatementText(String rawText, String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        List<TransactionRule> rules = ruleRepository.findByUserIdAndIsActiveTrue(effectiveUserId);
        List<ParsedTransactionDto> results = new ArrayList<>();

        if (rawText == null || rawText.isBlank()) return results;

        String[] lines = rawText.split("\\r?\\n");
        int currentYear = LocalDate.now().getYear();

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.length() < 8) continue;

            // Skip common statement header words
            String lower = line.toLowerCase();
            if (lower.contains("statement period") || lower.contains("page ") || lower.contains("beginning balance") ||
                lower.contains("ending balance") || lower.contains("account summary") || lower.contains("total deposits")) {
                continue;
            }

            Matcher dateMatcher = DATE_PATTERN.matcher(line);
            Matcher amountMatcher = AMOUNT_PATTERN.matcher(line);

            if (dateMatcher.find() && amountMatcher.find()) {
                String dateStr = dateMatcher.group();
                String amountStr = amountMatcher.group();

                // Clean date
                LocalDate parsedDate = parseHeuristicDate(dateStr, currentYear);

                // Clean amount
                BigDecimal amount = cleanAmountString(amountStr);
                boolean isIncome = amountStr.contains("+") || lower.contains("credit") || lower.contains("deposit") ||
                        lower.contains("payroll") || lower.contains("salary") || lower.contains("refund");
                TransactionType type = isIncome ? TransactionType.INCOME : TransactionType.EXPENSE;

                // Extract description: remove date and amount substrings from the line
                String desc = line.replace(dateStr, "").replace(amountStr, "").trim();
                desc = cleanStatementDescription(desc);

                if (desc.isBlank()) desc = "Statement Transaction";

                // Auto-categorize via active rules
                String suggestedCat = "General";
                String matchedRuleName = null;

                for (TransactionRule r : rules) {
                    if (r.getMatchValue() != null && desc.toLowerCase().contains(r.getMatchValue().toLowerCase())) {
                        suggestedCat = r.getApplyCategory();
                        matchedRuleName = r.getName();
                        if (r.getApplyMerchant() != null && !r.getApplyMerchant().isBlank()) {
                            desc = r.getApplyMerchant();
                        }
                        break;
                    }
                }

                results.add(ParsedTransactionDto.builder()
                        .date(parsedDate)
                        .merchant(desc)
                        .description(desc)
                        .amount(amount.abs())
                        .type(type)
                        .suggestedCategory(suggestedCat)
                        .ruleMatched(matchedRuleName)
                        .confidence(0.92)
                        .build());
            }
        }

        return results;
    }

    /**
     * 2. Open Banking Standard OFX / QFX / QIF Ingest Parser
     */
    public List<ParsedTransactionDto> parseOfxContent(String ofxContent, String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        List<TransactionRule> rules = ruleRepository.findByUserIdAndIsActiveTrue(effectiveUserId);
        List<ParsedTransactionDto> results = new ArrayList<>();

        if (ofxContent == null || ofxContent.isBlank()) return results;

        Pattern stmtTrnPattern = Pattern.compile("<STMTTRN>(.*?)</STMTTRN>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
        Matcher stmtMatcher = stmtTrnPattern.matcher(ofxContent);

        while (stmtMatcher.find()) {
            String block = stmtMatcher.group(1);

            String trnType = extractTagValue(block, "TRNTYPE");
            String dtPosted = extractTagValue(block, "DTPOSTED");
            String trnAmt = extractTagValue(block, "TRNAMT");
            String name = extractTagValue(block, "NAME");
            String memo = extractTagValue(block, "MEMO");

            if (trnAmt == null) continue;

            BigDecimal amt = cleanAmountString(trnAmt);
            TransactionType type = amt.compareTo(BigDecimal.ZERO) < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;

            LocalDate date = LocalDate.now();
            if (dtPosted != null && dtPosted.length() >= 8) {
                try {
                    String ymd = dtPosted.substring(0, 8);
                    date = LocalDate.parse(ymd, DateTimeFormatter.ofPattern("yyyyMMdd"));
                } catch (Exception ignored) {}
            }

            String desc = (name != null && !name.isBlank()) ? name.trim() : (memo != null ? memo.trim() : "OFX Transaction");
            desc = cleanStatementDescription(desc);

            String suggestedCat = "General";
            String ruleMatched = null;
            for (TransactionRule r : rules) {
                if (r.getMatchValue() != null && desc.toLowerCase().contains(r.getMatchValue().toLowerCase())) {
                    suggestedCat = r.getApplyCategory();
                    ruleMatched = r.getName();
                    if (r.getApplyMerchant() != null && !r.getApplyMerchant().isBlank()) {
                        desc = r.getApplyMerchant();
                    }
                    break;
                }
            }

            results.add(ParsedTransactionDto.builder()
                    .date(date)
                    .merchant(desc)
                    .description((memo != null && !memo.equals(name)) ? desc + " - " + memo.trim() : desc)
                    .amount(amt.abs())
                    .type(type)
                    .suggestedCategory(suggestedCat)
                    .ruleMatched(ruleMatched)
                    .confidence(0.98)
                    .build());
        }

        return results;
    }

    /**
     * 3. Smart Clip Notification & SMS Parser (Zero friction 1-second capture)
     */
    @Transactional
    public Transaction processSmartClip(String userId, SmartClipRequest req) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        String text = req.getText();
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Notification text cannot be empty");
        }

        BigDecimal amount = BigDecimal.ZERO;
        String merchant = "Card Transaction";
        TransactionType type = TransactionType.EXPENSE;

        Matcher spentMatcher = CLIP_SPENT_PATTERN.matcher(text);
        Matcher incMatcher = CLIP_INCOME_PATTERN.matcher(text);

        if (spentMatcher.find()) {
            amount = cleanAmountString(spentMatcher.group(1));
            merchant = spentMatcher.group(2).trim();
            type = TransactionType.EXPENSE;
        } else if (incMatcher.find()) {
            amount = cleanAmountString(incMatcher.group(1));
            merchant = incMatcher.group(2).trim();
            type = TransactionType.INCOME;
        } else {
            // Heuristic fallback
            Matcher amtMatcher = AMOUNT_PATTERN.matcher(text);
            if (amtMatcher.find()) {
                amount = cleanAmountString(amtMatcher.group(1)).abs();
                merchant = cleanStatementDescription(text.replace(amtMatcher.group(1), "").trim());
            } else {
                throw new IllegalArgumentException("Could not extract a valid transaction amount from the snippet");
            }
        }

        // Account Resolution
        UUID accountId = req.getAccountId();
        if (accountId == null) {
            Matcher cardMatcher = CARD_LAST4_PATTERN.matcher(text);
            List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc(effectiveUserId);

            if (cardMatcher.find()) {
                String last4 = cardMatcher.group(1);
                for (Account acc : accounts) {
                    if (last4.equals(acc.getAccountNumberLast4())) {
                        accountId = acc.getId();
                        break;
                    }
                }
            }

            if (accountId == null && !accounts.isEmpty()) {
                accountId = accounts.get(0).getId();
            }
        }

        if (accountId == null) {
            throw new IllegalStateException("No active account found to assign transaction to");
        }

        merchant = cleanStatementDescription(merchant);

        CreateTransactionRequest createReq = new CreateTransactionRequest();
        createReq.setUserId(effectiveUserId);
        createReq.setAccountId(accountId);
        createReq.setAmount(amount);
        createReq.setType(type);
        createReq.setMerchant(merchant);
        createReq.setDescription(merchant);
        createReq.setDate(LocalDate.now());
        createReq.setCategory("General");

        Transaction tx = ledgerService.recordTransaction(createReq);
        ruleService.applyRulesToTransaction(tx, effectiveUserId);
        return transactionRepository.save(tx);
    }

    /**
     * 4. Batch Commit Parsed Transactions to Ledger
     */
    @Transactional
    public Map<String, Object> commitParsedTransactions(String userId, UUID targetAccountId, List<ParsedTransactionDto> items) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        Account account = accountRepository.findById(targetAccountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + targetAccountId));

        int count = 0;
        for (ParsedTransactionDto item : items) {
            CreateTransactionRequest req = new CreateTransactionRequest();
            req.setUserId(effectiveUserId);
            req.setAccountId(account.getId());
            req.setAmount(item.getAmount());
            req.setType(item.getType() != null ? item.getType() : TransactionType.EXPENSE);
            req.setMerchant(item.getMerchant());
            req.setDescription(item.getDescription() != null ? item.getDescription() : item.getMerchant());
            req.setDate(item.getDate() != null ? item.getDate() : LocalDate.now());
            req.setCategory(item.getSuggestedCategory() != null ? item.getSuggestedCategory() : "General");

            Transaction tx = ledgerService.recordTransaction(req);
            ruleService.applyRulesToTransaction(tx, effectiveUserId);
            transactionRepository.save(tx);
            count++;
        }

        return Map.of("importedCount", count, "accountId", targetAccountId.toString(), "accountName", account.getName());
    }

    private BigDecimal cleanAmountString(String str) {
        if (str == null) return BigDecimal.ZERO;
        String clean = str.replace("$", "").replace(",", "").replace("(", "").replace(")", "").replace("+", "").trim();
        try {
            return new BigDecimal(clean);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private LocalDate parseHeuristicDate(String str, int defaultYear) {
        try {
            String cleaned = str.trim();
            if (cleaned.matches("\\d{1,2}[/-]\\d{1,2}")) {
                cleaned = cleaned + "/" + defaultYear;
            }
            if (cleaned.contains("/")) {
                String[] parts = cleaned.split("/");
                if (parts.length == 3) {
                    int m = Integer.parseInt(parts[0]);
                    int d = Integer.parseInt(parts[1]);
                    int y = Integer.parseInt(parts[2]);
                    if (y < 100) y += 2000;
                    return LocalDate.of(y, m, d);
                }
            } else if (cleaned.contains("-")) {
                String[] parts = cleaned.split("-");
                if (parts.length == 3) {
                    if (parts[0].length() == 4) {
                        return LocalDate.parse(cleaned);
                    }
                    int m = Integer.parseInt(parts[0]);
                    int d = Integer.parseInt(parts[1]);
                    int y = Integer.parseInt(parts[2]);
                    if (y < 100) y += 2000;
                    return LocalDate.of(y, m, d);
                }
            }
        } catch (Exception ignored) {}
        return LocalDate.now();
    }

    private String cleanStatementDescription(String desc) {
        if (desc == null) return "";
        return desc.replaceAll("(?i)\\b(POS DEBIT|CHECK CARD|PURCHASE|WITHDRAWAL|DEBIT|ACH|DIR DEP|RECURRING|ELECTRONIC)\\b", "")
                .replaceAll("[#*]{2,}", "")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }

    private String extractTagValue(String block, String tag) {
        Pattern p = Pattern.compile("<" + tag + ">(.*?)(?:<|$)", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(block);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }
}
