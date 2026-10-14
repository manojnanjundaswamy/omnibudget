package com.omnibudget.service;

import com.omnibudget.domain.*;
import com.omnibudget.dto.*;
import com.omnibudget.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaptureService {

    private final CaptureAddressRepository captureAddressRepository;
    private final CapturedItemRepository capturedItemRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionRuleRepository ruleRepository;
    private final BudgetEnvelopeRepository envelopeRepository;
    private final LedgerService ledgerService;
    private final NotificationService notificationService;

    @Value("${app.capture.domain:inbound.omnibudget.local}")
    private String captureDomain;

    private static final Pattern GMAIL_CODE = Pattern.compile("Confirmation code:\\s*([0-9]{6,12})", Pattern.CASE_INSENSITIVE);
    private static final Pattern GMAIL_LINK = Pattern.compile("(https://mail(?:-settings)?\\.google\\.com/mail/\\S+)", Pattern.CASE_INSENSITIVE);

    /**
     * Get or create a unique forwarding email address for the user
     */
    @Transactional
    public CaptureAddress getOrCreateAddress(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        return captureAddressRepository.findByUserId(effectiveUserId)
                .orElseGet(() -> {
                    String token = "usr-" + UUID.randomUUID().toString().substring(0, 8);
                    String inboundEmail = token + "@" + captureDomain;
                    CaptureAddress address = CaptureAddress.builder()
                            .userId(effectiveUserId)
                            .token(token)
                            .inboundEmail(inboundEmail)
                            .build();
                    return captureAddressRepository.save(address);
                });
    }

    /**
     * Invalidate old address and generate a fresh forwarding address
     */
    @Transactional
    public CaptureViewDto resetAddress(String userId) {
        CaptureAddress address = getOrCreateAddress(userId);
        String token = "usr-" + UUID.randomUUID().toString().substring(0, 8);
        address.setToken(token);
        address.setInboundEmail(token + "@" + captureDomain);
        address.setConfirmationCode(null);
        address.setConfirmationLink(null);
        address.setConfirmationAt(null);
        captureAddressRepository.save(address);
        return getView(userId);
    }

    /**
     * Get the full capture view: personal address, Gmail confirmation state, pending items, recent history
     */
    @Transactional
    public CaptureViewDto getView(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        CaptureAddress address = getOrCreateAddress(effectiveUserId);

        CaptureViewDto.ConfirmationDto confDto = null;
        if (address.getConfirmationAt() != null &&
                address.getConfirmationAt().isAfter(Instant.now().minusSeconds(7 * 86_400))) {
            confDto = CaptureViewDto.ConfirmationDto.builder()
                    .code(address.getConfirmationCode())
                    .link(address.getConfirmationLink())
                    .receivedAt(address.getConfirmationAt())
                    .build();
        }

        Instant twoDaysAgo = Instant.now().minusSeconds(2 * 86_400);
        List<CapturedItem> items = capturedItemRepository.findActiveOrRecentByUserId(effectiveUserId, twoDaysAgo);
        long pending = capturedItemRepository.countByUserIdAndStatus(effectiveUserId, "PENDING");

        return CaptureViewDto.builder()
                .address(address.getInboundEmail())
                .emailReady(true)
                .confirmation(confDto)
                .pending(pending)
                .items(items)
                .lastEmailAt(address.getLastEmailAt())
                .build();
    }

    @Transactional(readOnly = true)
    public long getPendingCount(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        return capturedItemRepository.countByUserIdAndStatus(effectiveUserId, "PENDING");
    }

    /**
     * Paste bank SMS, copied email, or shared text
     */
    @Transactional
    public PasteCaptureResponse paste(String userId, String text, String source) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        String effectiveSource = (source != null && !source.isBlank()) ? source : "PASTE";

        if (text == null || text.isBlank()) {
            return new PasteCaptureResponse(0, 0, 0, List.of());
        }

        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc(effectiveUserId);
        if (accounts.isEmpty()) {
            accounts = accountRepository.findByIsActiveTrueOrderByCreatedAtAsc();
        }
        List<TransactionRule> rules = ruleRepository.findByUserIdAndIsActiveTrue(effectiveUserId);

        int added = 0;
        int duplicates = 0;
        int unreadable = 0;
        List<CapturedItem> savedItems = new ArrayList<>();

        for (String message : AlertParser.split(text)) {
            AlertParser.Parsed p = AlertParser.parse(message, null, LocalDate.now());
            if (p == null && AlertParser.noise(message)) {
                continue;
            }

            // Deduplication against recent transactions
            UUID duplicateTxId = null;
            if (p != null) {
                duplicateTxId = findDuplicateTransaction(effectiveUserId, p.on(), p.amount(), p.merchant());
            }

            // Account heuristic matching (last 4 digits or institution name)
            Account matchedAccount = matchAccount(accounts, p);

            // Rule-based category matching
            String category = "General";
            String categorySource = "HEURISTIC";
            if (p != null) {
                String searchStr = (p.merchant() != null ? p.merchant() : "") + " " + (p.bank() != null ? p.bank() : "");
                for (TransactionRule r : rules) {
                    if (r.getMatchValue() != null && searchStr.toLowerCase().contains(r.getMatchValue().toLowerCase())) {
                        category = r.getApplyCategory();
                        categorySource = "RULE";
                        break;
                    }
                }
            }

            String status = (p != null) ? "PENDING" : "UNREADABLE";

            CapturedItem item = CapturedItem.builder()
                    .userId(effectiveUserId)
                    .source(effectiveSource)
                    .status(status)
                    .sender(null)
                    .subject(null)
                    .body(message)
                    .kind(p != null ? ("INCOME".equalsIgnoreCase(p.kind()) ? TransactionType.INCOME : TransactionType.EXPENSE) : null)
                    .amount(p != null ? p.amount() : null)
                    .occurredOn(p != null ? p.on() : LocalDate.now())
                    .merchant(p != null ? p.merchant() : null)
                    .bank(p != null ? p.bank() : null)
                    .accountHint(p != null ? p.accountHint() : null)
                    .balance(p != null ? p.balance() : null)
                    .accountId(matchedAccount != null ? matchedAccount.getId() : (accounts.isEmpty() ? null : accounts.get(0).getId()))
                    .accountName(matchedAccount != null ? matchedAccount.getName() : (accounts.isEmpty() ? "Default" : accounts.get(0).getName()))
                    .category(category)
                    .categorySource(categorySource)
                    .duplicateOf(duplicateTxId)
                    .receivedAt(Instant.now())
                    .build();

            item = capturedItemRepository.save(item);
            savedItems.add(item);

            if (duplicateTxId != null) {
                duplicates++;
            } else if (p != null) {
                added++;
            } else {
                unreadable++;
            }
        }

        return PasteCaptureResponse.builder()
                .added(added)
                .duplicates(duplicates)
                .unreadable(unreadable)
                .items(savedItems)
                .build();
    }

    /**
     * Add a reviewed captured item as a real transaction
     */
    @Transactional
    public CapturedItem add(String userId, UUID itemId, AddCapturedItemRequest req) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        CapturedItem item = capturedItemRepository.findByIdAndUserId(itemId, effectiveUserId)
                .orElseThrow(() -> new IllegalArgumentException("Captured item not found: " + itemId));

        if ("ADDED".equals(item.getStatus()) || "DISMISSED".equals(item.getStatus())) {
            throw new IllegalStateException("Item has already been decided.");
        }

        UUID targetAccountId = req.getAccountId() != null ? req.getAccountId() : item.getAccountId();
        if (targetAccountId == null) {
            List<Account> accs = accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc(effectiveUserId);
            if (accs.isEmpty()) accs = accountRepository.findByIsActiveTrueOrderByCreatedAtAsc();
            if (!accs.isEmpty()) targetAccountId = accs.get(0).getId();
            else throw new IllegalArgumentException("No account available to record transaction.");
        }

        TransactionType type = req.getKind() != null ? req.getKind() : (item.getKind() != null ? item.getKind() : TransactionType.EXPENSE);
        BigDecimal amount = req.getAmount() != null ? req.getAmount() : (item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO);
        LocalDate date = req.getOccurredOn() != null ? req.getOccurredOn() : (item.getOccurredOn() != null ? item.getOccurredOn() : LocalDate.now());
        String desc = req.getDescription() != null && !req.getDescription().isBlank() ? req.getDescription() :
                (item.getMerchant() != null ? item.getMerchant() : (item.getBank() != null ? item.getBank() : "Bank Alert"));
        String cat = req.getCategory() != null && !req.getCategory().isBlank() ? req.getCategory() :
                (item.getCategory() != null ? item.getCategory() : "General");

        CreateTransactionRequest createReq = CreateTransactionRequest.builder()
                .userId(effectiveUserId)
                .accountId(targetAccountId)
                .amount(amount)
                .type(type)
                .category(cat)
                .envelopeId(req.getEnvelopeId())
                .merchant(req.getMerchant() != null ? req.getMerchant() : item.getMerchant())
                .description(desc)
                .date(date)
                .isRecurring(false)
                .build();

        Transaction tx = ledgerService.recordTransaction(createReq);

        item.setStatus("ADDED");
        item.setTransactionId(tx.getId());
        item.setDecidedAt(Instant.now());
        item.setBody(null); // Privacy: discard raw body once committed

        return capturedItemRepository.save(item);
    }

    /**
     * Dismiss a captured item
     */
    @Transactional
    public CapturedItem dismiss(String userId, UUID itemId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        CapturedItem item = capturedItemRepository.findByIdAndUserId(itemId, effectiveUserId)
                .orElseThrow(() -> new IllegalArgumentException("Captured item not found: " + itemId));

        item.setStatus("DISMISSED");
        item.setDecidedAt(Instant.now());
        item.setBody(null);

        return capturedItemRepository.save(item);
    }

    /**
     * Inbound email webhook handler (called by mail receiver or relay)
     */
    @Transactional
    public Map<String, Object> processInboundEmail(String envelopeTo, String rawText, String from, String subject) {
        log.info("Processing inbound email to: {}, from: {}, subject: {}", envelopeTo, from, subject);
        if (envelopeTo == null || envelopeTo.isBlank()) {
            return Map.of("status", "error", "message", "Missing envelopeTo");
        }

        String recipient = envelopeTo.trim().toLowerCase(Locale.ROOT).replaceAll("^<|>$", "");
        int atIdx = recipient.indexOf('@');
        if (atIdx <= 0) {
            return Map.of("status", "error", "message", "Invalid recipient");
        }

        String token = recipient.substring(0, atIdx).replaceAll("\\+.*$", "");
        CaptureAddress address = captureAddressRepository.findByToken(token)
                .orElse(null);

        if (address == null) {
            log.warn("No capture address found for token: {}", token);
            return Map.of("status", "ignored", "reason", "unknown-recipient");
        }

        String effectiveUserId = address.getUserId();
        String fullContent = ((subject != null ? subject + "\n" : "") + (rawText != null ? rawText : "")).trim();

        // 1. Check for Gmail Forwarding Confirmation
        if ((from != null && from.toLowerCase(Locale.ROOT).contains("forwarding-noreply@google.com")) ||
                fullContent.contains("Confirmation code:") || fullContent.contains("google.com/mail")) {
            Matcher codeMatcher = GMAIL_CODE.matcher(fullContent);
            Matcher linkMatcher = GMAIL_LINK.matcher(fullContent);

            String code = codeMatcher.find() ? codeMatcher.group(1) : null;
            String link = linkMatcher.find() ? linkMatcher.group(1) : null;

            address.setConfirmationCode(code);
            address.setConfirmationLink(link);
            address.setConfirmationAt(Instant.now());
            captureAddressRepository.save(address);

            // Notify user in-app
            try {
                UUID userUuid = null;
                try { userUuid = UUID.fromString(effectiveUserId); } catch (Exception ignored) {}
                notificationService.createNotification(
                        userUuid,
                        "Gmail Forwarding Code Arrived",
                        "Confirmation code: " + (code != null ? code : "Link received") + ". Click to complete setup.",
                        NotificationType.TRANSACTION_ALERT,
                        NotificationSeverity.ALERT,
                        "capture",
                        null
                );
            } catch (Exception ex) {
                log.info("Notification sent for confirmation code");
            }

            return Map.of("status", "success", "type", "gmail-confirmation", "code", code != null ? code : "");
        }

        // 2. Parse bank transaction email
        String clean = AlertParser.clean(fullContent);
        if (AlertParser.noise(clean)) {
            return Map.of("status", "ignored", "reason", "noise-or-otp");
        }

        AlertParser.Parsed p = AlertParser.parse(clean, from, LocalDate.now());
        address.setLastEmailAt(Instant.now());
        captureAddressRepository.save(address);

        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc(effectiveUserId);
        if (accounts.isEmpty()) accounts = accountRepository.findByIsActiveTrueOrderByCreatedAtAsc();
        Account matchedAccount = matchAccount(accounts, p);

        UUID duplicateTxId = (p != null) ? findDuplicateTransaction(effectiveUserId, p.on(), p.amount(), p.merchant()) : null;

        CapturedItem item = CapturedItem.builder()
                .userId(effectiveUserId)
                .source("EMAIL")
                .status(p != null ? "PENDING" : "UNREADABLE")
                .sender(from)
                .subject(subject)
                .body(clean)
                .kind(p != null ? ("INCOME".equalsIgnoreCase(p.kind()) ? TransactionType.INCOME : TransactionType.EXPENSE) : null)
                .amount(p != null ? p.amount() : null)
                .occurredOn(p != null ? p.on() : LocalDate.now())
                .merchant(p != null ? p.merchant() : null)
                .bank(p != null ? p.bank() : null)
                .accountHint(p != null ? p.accountHint() : null)
                .balance(p != null ? p.balance() : null)
                .accountId(matchedAccount != null ? matchedAccount.getId() : (accounts.isEmpty() ? null : accounts.get(0).getId()))
                .accountName(matchedAccount != null ? matchedAccount.getName() : (accounts.isEmpty() ? "Default" : accounts.get(0).getName()))
                .category("General")
                .categorySource("HEURISTIC")
                .duplicateOf(duplicateTxId)
                .receivedAt(Instant.now())
                .build();

        item = capturedItemRepository.save(item);

        // Notify user
        try {
            if (p != null) {
                UUID userUuid = null;
                try { userUuid = UUID.fromString(effectiveUserId); } catch (Exception ignored) {}
                notificationService.createNotification(
                        userUuid,
                        "Bank Alert Received (" + (p.bank() != null ? p.bank() : "Email") + ")",
                        (p.merchant() != null ? p.merchant() : "Transaction") + " for " + p.amount() + " waiting for review.",
                        NotificationType.TRANSACTION_ALERT,
                        NotificationSeverity.INFO,
                        "capture",
                        item.getId().toString()
                );
            }
        } catch (Exception ignored) {}

        return Map.of("status", "success", "type", "transaction-captured", "itemId", item.getId());
    }

    private Account matchAccount(List<Account> accounts, AlertParser.Parsed p) {
        if (accounts == null || accounts.isEmpty() || p == null) return null;

        // 1. Try matching by last 4 digits
        if (p.accountHint() != null && !p.accountHint().isBlank()) {
            for (Account a : accounts) {
                if (a.getAccountNumberLast4() != null && a.getAccountNumberLast4().endsWith(p.accountHint())) {
                    return a;
                }
                if (a.getName() != null && a.getName().contains(p.accountHint())) {
                    return a;
                }
            }
        }

        // 2. Try matching by bank / institution name
        if (p.bank() != null && !p.bank().isBlank()) {
            String bankLow = p.bank().toLowerCase();
            for (Account a : accounts) {
                if (a.getInstitutionName() != null && a.getInstitutionName().toLowerCase().contains(bankLow)) {
                    return a;
                }
                if (a.getName() != null && a.getName().toLowerCase().contains(bankLow)) {
                    return a;
                }
            }
        }

        return accounts.get(0);
    }

    private UUID findDuplicateTransaction(String userId, LocalDate date, BigDecimal amount, String merchant) {
        if (date == null || amount == null) return null;
        List<Transaction> txs = transactionRepository.findByDateBetweenOrderByDateDesc(date.minusDays(2), date.plusDays(2));
        for (Transaction t : txs) {
            if (t.getAmount() != null && t.getAmount().abs().compareTo(amount.abs()) == 0) {
                if (merchant != null && t.getMerchant() != null &&
                        (t.getMerchant().toLowerCase().contains(merchant.toLowerCase()) || merchant.toLowerCase().contains(t.getMerchant().toLowerCase()))) {
                    return t.getId();
                }
            }
        }
        return null;
    }
}
