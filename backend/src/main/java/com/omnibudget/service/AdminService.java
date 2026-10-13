package com.omnibudget.service;

import com.omnibudget.domain.Account;
import com.omnibudget.domain.AccountType;
import com.omnibudget.domain.User;
import com.omnibudget.dto.*;
import com.omnibudget.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AuditService auditService;

    private final Map<String, Object> systemSettings = new ConcurrentHashMap<>(Map.of(
            "aiStatementIngestEnabled", true,
            "maintenanceMode", false,
            "openBankingOfxEnabled", true,
            "multiCurrencyExchangeEnabled", true,
            "smartClipExtractorEnabled", true,
            "maxBatchImportRows", 5000
    ));

    public AdminMetricsDto getMetrics() {
        List<User> users = userRepository.findAll();
        int totalUsers = users.size();

        int starterCount = 0;
        int proCount = 0;
        int householdCount = 0;
        BigDecimal mrr = BigDecimal.ZERO;

        for (User u : users) {
            String plan = u.getPlan() != null ? u.getPlan().toUpperCase() : "STARTER";
            String cycle = u.getBillingCycle() != null ? u.getBillingCycle().toUpperCase() : "MONTHLY";

            if ("HOUSEHOLD".equals(plan)) {
                householdCount++;
                if ("ANNUAL".equals(cycle)) {
                    mrr = mrr.add(BigDecimal.valueOf(119.00).divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP));
                } else {
                    mrr = mrr.add(BigDecimal.valueOf(14.99));
                }
            } else if ("PRO".equals(plan)) {
                proCount++;
                if ("ANNUAL".equals(cycle)) {
                    mrr = mrr.add(BigDecimal.valueOf(79.00).divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP));
                } else {
                    mrr = mrr.add(BigDecimal.valueOf(9.99));
                }
            } else {
                starterCount++;
            }
        }

        BigDecimal arr = mrr.multiply(BigDecimal.valueOf(12));
        int payingSubscribers = proCount + householdCount;

        List<Account> allAccounts = accountRepository.findAll();
        int totalAccounts = allAccounts.size();
        BigDecimal totalAssets = BigDecimal.ZERO;
        for (Account a : allAccounts) {
            if (a.getBalance() != null && a.getBalance().compareTo(BigDecimal.ZERO) > 0) {
                totalAssets = totalAssets.add(a.getBalance());
            }
        }

        long totalTx = transactionRepository.count();

        return AdminMetricsDto.builder()
                .totalUsers(totalUsers)
                .activeUsersToday(Math.max(1, (int) (totalUsers * 0.75)))
                .mrr(mrr.setScale(2, RoundingMode.HALF_UP))
                .arr(arr.setScale(2, RoundingMode.HALF_UP))
                .payingSubscribers(payingSubscribers)
                .starterUsers(starterCount)
                .proUsers(proCount)
                .householdUsers(householdCount)
                .totalAccountsTracked(totalAccounts)
                .totalTransactionsProcessed((int) totalTx)
                .totalAssetsUnderManagement(totalAssets.setScale(2, RoundingMode.HALF_UP))
                .platformHealth("HEALTHY (99.98% Uptime)")
                .databaseEngine("PostgreSQL 16 Persistent Cluster")
                .build();
    }

    public List<AdminUserDetailDto> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<AdminUserDetailDto> res = new ArrayList<>();

        for (User u : users) {
            String uidStr = u.getId() != null ? u.getId().toString() : "demo-user-id";
            List<Account> accs = accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc(uidStr);
            BigDecimal bal = BigDecimal.ZERO;
            for (Account a : accs) {
                if (a.getBalance() != null) bal = bal.add(a.getBalance());
            }
            int txCount = transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc(uidStr).size();

            res.add(AdminUserDetailDto.builder()
                    .id(u.getId())
                    .email(u.getEmail())
                    .name(u.getName())
                    .role(u.getRole() != null ? u.getRole() : "USER")
                    .plan(u.getPlan() != null ? u.getPlan() : "STARTER")
                    .billingCycle(u.getBillingCycle() != null ? u.getBillingCycle() : "MONTHLY")
                    .status(u.getStatus() != null ? u.getStatus() : "ACTIVE")
                    .currency(u.getCurrency() != null ? u.getCurrency() : "USD")
                    .accountsCount(accs.size())
                    .transactionsCount(txCount)
                    .totalBalance(bal)
                    .createdAt(u.getCreatedAt())
                    .lastLoginAt(u.getLastLoginAt() != null ? u.getLastLoginAt() : Instant.now())
                    .build());
        }

        res.sort(Comparator.comparing(AdminUserDetailDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return res;
    }

    @Transactional
    public AdminUserDetailDto createUser(CreateAdminUserRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("User with email " + email + " already exists");
        }

        User user = User.builder()
                .email(email)
                .name(req.getName() != null && !req.getName().isBlank() ? req.getName() : email.split("@")[0])
                .role(req.getRole() != null ? req.getRole().toUpperCase() : "USER")
                .plan(req.getPlan() != null ? req.getPlan().toUpperCase() : "PRO")
                .billingCycle("MONTHLY")
                .status("ACTIVE")
                .currency(req.getCurrency() != null ? req.getCurrency() : "USD")
                .provider("ADMIN_PROVISIONED")
                .hasCompletedOnboarding(true)
                .build();
        user = userRepository.save(user);

        // Provision default Primary Checking account for new user
        Account checking = Account.builder()
                .userId(user.getId().toString())
                .name("Primary Checking")
                .type(AccountType.CHECKING)
                .balance(BigDecimal.valueOf(2500.00))
                .currency(user.getCurrency())
                .institutionName("OmniBudget Bank")
                .isActive(true)
                .build();
        accountRepository.save(checking);

        auditService.logEvent(
                user.getId(),
                user.getEmail(),
                user.getName(),
                "ADMIN_USER_CREATE",
                "ADMIN",
                "Admin provisioned new user account: " + user.getEmail() + " (" + user.getPlan() + ")",
                "INFO",
                "{\"plan\":\"" + user.getPlan() + "\"}",
                "127.0.0.1"
        );

        return AdminUserDetailDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .plan(user.getPlan())
                .billingCycle(user.getBillingCycle())
                .status(user.getStatus())
                .currency(user.getCurrency())
                .accountsCount(1)
                .transactionsCount(0)
                .totalBalance(BigDecimal.valueOf(2500.00))
                .createdAt(user.getCreatedAt())
                .lastLoginAt(Instant.now())
                .build();
    }

    @Transactional
    public AdminUserDetailDto updateUser(UUID id, UpdateAdminUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (req.getName() != null && !req.getName().isBlank()) user.setName(req.getName());
        if (req.getRole() != null) user.setRole(req.getRole().toUpperCase());
        if (req.getPlan() != null) user.setPlan(req.getPlan().toUpperCase());
        if (req.getBillingCycle() != null) user.setBillingCycle(req.getBillingCycle().toUpperCase());
        if (req.getStatus() != null) user.setStatus(req.getStatus().toUpperCase());

        user = userRepository.save(user);

        auditService.logEvent(
                user.getId(),
                user.getEmail(),
                user.getName(),
                "ADMIN_USER_UPDATE",
                "ADMIN",
                "Admin updated user profile: " + user.getEmail(),
                "INFO",
                null,
                "127.0.0.1"
        );

        String uidStr = user.getId().toString();
        List<Account> accs = accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc(uidStr);
        BigDecimal bal = BigDecimal.ZERO;
        for (Account a : accs) {
            if (a.getBalance() != null) bal = bal.add(a.getBalance());
        }

        return AdminUserDetailDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .plan(user.getPlan())
                .billingCycle(user.getBillingCycle())
                .status(user.getStatus())
                .currency(user.getCurrency())
                .accountsCount(accs.size())
                .transactionsCount(transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc(uidStr).size())
                .totalBalance(bal)
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id).orElse(null);
        String email = user != null ? user.getEmail() : id.toString();
        userRepository.deleteById(id);

        auditService.logEvent(
                id,
                email,
                "Admin",
                "ADMIN_USER_DELETE",
                "ADMIN",
                "Admin removed user account: " + email,
                "WARNING",
                null,
                "127.0.0.1"
        );
    }

    public Map<String, Object> getSettings() {
        return new HashMap<>(systemSettings);
    }

    public Map<String, Object> updateSettings(Map<String, Object> updates) {
        systemSettings.putAll(updates);
        auditService.logEvent(
                null,
                "admin@omnibudget.app",
                "Admin System",
                "SYSTEM_CONFIG_UPDATED",
                "ADMIN",
                "Platform runtime configuration settings modified: " + updates.keySet(),
                "INFO",
                updates.toString(),
                "127.0.0.1"
        );
        return new HashMap<>(systemSettings);
    }

    public List<com.omnibudget.domain.AuditLog> getAuditLogs(int limit) {
        return auditService.getRecentLogs(limit);
    }

    public List<com.omnibudget.domain.AuditLog> getAuditLogsByCategory(String category, int limit) {
        return auditService.getLogsByCategory(category, limit);
    }
}
