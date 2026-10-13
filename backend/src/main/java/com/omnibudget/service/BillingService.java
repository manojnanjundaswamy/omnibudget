package com.omnibudget.service;

import com.omnibudget.domain.User;
import com.omnibudget.dto.BillingPlanDto;
import com.omnibudget.dto.SubscriptionSummaryDto;
import com.omnibudget.dto.UpgradePlanRequest;
import com.omnibudget.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final BudgetEnvelopeRepository envelopeRepository;
    private final GoalRepository goalRepository;
    private final TransactionRuleRepository ruleRepository;
    private final AuthService authService;

    public List<BillingPlanDto> getPlansCatalog() {
        return List.of(
                BillingPlanDto.builder()
                        .id("STARTER")
                        .name("Starter")
                        .tagline("Essential budgeting for individuals taking control of their money")
                        .monthlyPrice(BigDecimal.ZERO)
                        .annualPrice(BigDecimal.ZERO)
                        .maxAccounts(3)
                        .maxBudgets(5)
                        .maxGoals(1)
                        .rulesEngineEnabled(false)
                        .recurringCalendarEnabled(false)
                        .householdCollaborationEnabled(false)
                        .splitSettlementEnabled(false)
                        .isPopular(false)
                        .features(List.of(
                                "Up to 3 financial accounts",
                                "5 category spending budgets",
                                "1 active financial goal",
                                "Standard cash flow summary",
                                "Manual CSV transaction export",
                                "Community support"
                        ))
                        .build(),
                BillingPlanDto.builder()
                        .id("PRO")
                        .name("Pro")
                        .tagline("Full wealth mastery benchmarked against Monarch & Spendee")
                        .monthlyPrice(BigDecimal.valueOf(9.99))
                        .annualPrice(BigDecimal.valueOf(79.00))
                        .maxAccounts(9999)
                        .maxBudgets(9999)
                        .maxGoals(9999)
                        .rulesEngineEnabled(true)
                        .recurringCalendarEnabled(true)
                        .householdCollaborationEnabled(false)
                        .splitSettlementEnabled(false)
                        .isPopular(true)
                        .features(List.of(
                                "Unlimited accounts & institutions",
                                "Unlimited category budgets (50/30/20)",
                                "Unlimited financial wealth goals",
                                "Monarch-style cash flow & savings rate (%)",
                                "Automated transaction categorization rules",
                                "Recurring subscriptions & bill calendar",
                                "Full CSV import & export (Mint/Monarch/Chase)",
                                "Multi-currency switcher (USD, EUR, GBP, CAD, INR)"
                        ))
                        .build(),
                BillingPlanDto.builder()
                        .id("HOUSEHOLD")
                        .name("Household")
                        .tagline("Multiplayer finances for couples, families, and shared households")
                        .monthlyPrice(BigDecimal.valueOf(14.99))
                        .annualPrice(BigDecimal.valueOf(119.00))
                        .maxAccounts(9999)
                        .maxBudgets(9999)
                        .maxGoals(9999)
                        .rulesEngineEnabled(true)
                        .recurringCalendarEnabled(true)
                        .householdCollaborationEnabled(true)
                        .splitSettlementEnabled(true)
                        .isPopular(false)
                        .features(List.of(
                                "Everything included in Pro",
                                "Joint household collaboration (invite partner/spouse)",
                                "Group expense splitting & debt settlement (Splitwise built-in)",
                                "Shared multi-wallet balances",
                                "Household audit trail & member activity log",
                                "Priority concierge customer support"
                        ))
                        .build()
        );
    }

    public SubscriptionSummaryDto getSubscriptionSummary(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        User user = authService.getCurrentUser(effectiveUserId);

        String planId = user.getPlan() != null ? user.getPlan().toUpperCase() : "PRO";
        String cycle = user.getBillingCycle() != null ? user.getBillingCycle().toUpperCase() : "MONTHLY";
        String status = user.getSubscriptionStatus() != null ? user.getSubscriptionStatus().toUpperCase() : "ACTIVE";

        int accountsCount = accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc(effectiveUserId).size();
        int budgetsCount = envelopeRepository.findByUserIdOrderByGroupTypeAscCreatedAtAsc(effectiveUserId).size();
        int goalsCount = goalRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId).size();
        int rulesCount = ruleRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId).size();

        int accountsLimit = "STARTER".equals(planId) ? 3 : 9999;
        int budgetsLimit = "STARTER".equals(planId) ? 5 : 9999;
        int goalsLimit = "STARTER".equals(planId) ? 1 : 9999;

        BigDecimal price = BigDecimal.ZERO;
        if ("PRO".equals(planId)) {
            price = "ANNUAL".equals(cycle) ? BigDecimal.valueOf(79.00) : BigDecimal.valueOf(9.99);
        } else if ("HOUSEHOLD".equals(planId)) {
            price = "ANNUAL".equals(cycle) ? BigDecimal.valueOf(119.00) : BigDecimal.valueOf(14.99);
        }

        return SubscriptionSummaryDto.builder()
                .planId(planId)
                .planName("HOUSEHOLD".equals(planId) ? "Household" : ("STARTER".equals(planId) ? "Starter" : "Pro"))
                .billingCycle(cycle)
                .status(status)
                .currentPrice(price)
                .renewsAt(Instant.now().plus(30, ChronoUnit.DAYS))
                .accountsUsed(accountsCount)
                .accountsLimit(accountsLimit)
                .budgetsUsed(budgetsCount)
                .budgetsLimit(budgetsLimit)
                .goalsUsed(goalsCount)
                .goalsLimit(goalsLimit)
                .rulesUsed(rulesCount)
                .rulesEnabled(!"STARTER".equals(planId))
                .householdEnabled("HOUSEHOLD".equals(planId))
                .splitSettlementEnabled("HOUSEHOLD".equals(planId))
                .build();
    }

    @Transactional
    public SubscriptionSummaryDto upgradePlan(String userId, UpgradePlanRequest req) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        User user = authService.getCurrentUser(effectiveUserId);

        if (req.getPlan() != null && !req.getPlan().isBlank()) {
            user.setPlan(req.getPlan().toUpperCase());
        }
        if (req.getBillingCycle() != null && !req.getBillingCycle().isBlank()) {
            user.setBillingCycle(req.getBillingCycle().toUpperCase());
        }
        user.setSubscriptionStatus("ACTIVE");
        userRepository.save(user);

        log.info("User {} upgraded/switched plan to {} ({})", effectiveUserId, user.getPlan(), user.getBillingCycle());
        return getSubscriptionSummary(effectiveUserId);
    }
}
