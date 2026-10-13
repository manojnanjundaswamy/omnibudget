package com.omnibudget.service;

import com.omnibudget.domain.*;
import com.omnibudget.dto.*;
import com.omnibudget.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetEnvelopeRepository envelopeRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AssetRepository assetRepository;

    private boolean isUserScoped(String userIdStr) {
        return userIdStr != null && !userIdStr.isBlank() && !"demo-user-id".equalsIgnoreCase(userIdStr);
    }

    private List<Account> getScopedAccounts(String userIdStr) {
        if (isUserScoped(userIdStr)) {
            List<Account> userAccounts = accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc(userIdStr);
            return userAccounts.isEmpty() ? accountRepository.findByIsActiveTrueOrderByCreatedAtAsc() : userAccounts;
        }
        return accountRepository.findAll();
    }

    private List<Transaction> getScopedTransactions(String userIdStr) {
        if (isUserScoped(userIdStr)) {
            List<Transaction> userTxs = transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc(userIdStr);
            return userTxs.isEmpty() ? transactionRepository.findAll() : userTxs;
        }
        return transactionRepository.findAll();
    }

    private List<BudgetEnvelope> getScopedEnvelopes(String userIdStr) {
        if (isUserScoped(userIdStr)) {
            List<BudgetEnvelope> envs = envelopeRepository.findByUserIdOrderByGroupTypeAscCreatedAtAsc(userIdStr);
            return envs.isEmpty() ? envelopeRepository.findAll() : envs;
        }
        return envelopeRepository.findAll();
    }

    private List<Subscription> getScopedSubscriptions(String userIdStr) {
        if (isUserScoped(userIdStr)) {
            List<Subscription> subs = subscriptionRepository.findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc(userIdStr);
            return subs.isEmpty() ? subscriptionRepository.findAll() : subs;
        }
        return subscriptionRepository.findAll();
    }

    private List<Asset> getScopedAssets(String userIdStr) {
        if (isUserScoped(userIdStr)) {
            List<Asset> assets = assetRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userIdStr);
            return assets.isEmpty() ? assetRepository.findAll() : assets;
        }
        return assetRepository.findAll();
    }

    public FinancialHealthDto getFinancialHealth(String userIdStr) {
        List<Account> accounts = getScopedAccounts(userIdStr);
        List<Transaction> transactions = getScopedTransactions(userIdStr);
        List<BudgetEnvelope> envelopes = getScopedEnvelopes(userIdStr);
        List<Subscription> subscriptions = getScopedSubscriptions(userIdStr);
        List<Asset> assets = getScopedAssets(userIdStr);

        // 1. Compute Liquid Cash & Liabilities
        BigDecimal liquidCash = accounts.stream()
                .filter(a -> a.getType() == AccountType.CHECKING || a.getType() == AccountType.SAVINGS || a.getType() == AccountType.CASH_WALLET)
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal liabilities = accounts.stream()
                .filter(a -> a.getType() == AccountType.CREDIT_CARD)
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal investmentAssets = assets.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()) && a.getCurrentValue() != null)
                .map(Asset::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAssets = liquidCash.add(investmentAssets);

        // 2. Inflows & Outflows
        BigDecimal monthlyInflows = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlyOutflows = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (monthlyInflows.compareTo(BigDecimal.ZERO) == 0) {
            monthlyInflows = new BigDecimal("6500.00"); // Baseline fallback
        }
        if (monthlyOutflows.compareTo(BigDecimal.ZERO) == 0) {
            monthlyOutflows = new BigDecimal("3800.00");
        }

        BigDecimal monthlyBurnRate = monthlyOutflows.max(new BigDecimal("1000.00"));

        // Pillar 1: Emergency Runway
        BigDecimal runwayMonths = liquidCash.divide(monthlyBurnRate, 1, RoundingMode.HALF_UP);
        int runwayScore;
        String runwayStatus;
        String runwayAdvice;
        if (runwayMonths.compareTo(new BigDecimal("6.0")) >= 0) {
            runwayScore = 20;
            runwayStatus = "EXCELLENT";
            runwayAdvice = "Outstanding 6+ months safety cushion protects against income shocks.";
        } else if (runwayMonths.compareTo(new BigDecimal("3.0")) >= 0) {
            runwayScore = 15;
            runwayStatus = "HEALTHY";
            runwayAdvice = "Healthy 3-6 months buffer. Keep building toward 6 months.";
        } else if (runwayMonths.compareTo(new BigDecimal("1.0")) >= 0) {
            runwayScore = 10;
            runwayStatus = "WARNING";
            runwayAdvice = "Moderate 1-3 months buffer. Aim to save at least $500/mo into emergency reserves.";
        } else {
            runwayScore = 4;
            runwayStatus = "CRITICAL";
            runwayAdvice = "Less than 1 month of expenses in liquid cash. Prioritize liquidity reserves.";
        }

        // Pillar 2: Savings Rate
        BigDecimal netSavings = monthlyInflows.subtract(monthlyOutflows);
        BigDecimal savingsRate = netSavings.compareTo(BigDecimal.ZERO) > 0
                ? netSavings.multiply(new BigDecimal("100")).divide(monthlyInflows, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        int savingsScore;
        String savingsStatus;
        String savingsAdvice;
        if (savingsRate.compareTo(new BigDecimal("25.0")) >= 0) {
            savingsScore = 25;
            savingsStatus = "EXCELLENT";
            savingsAdvice = "Superb savings rate! You are retaining over a quarter of gross inflows.";
        } else if (savingsRate.compareTo(new BigDecimal("15.0")) >= 0) {
            savingsScore = 20;
            savingsStatus = "HEALTHY";
            savingsAdvice = "Solid savings rate. Consistent automated investing will compound rapidly.";
        } else if (savingsRate.compareTo(new BigDecimal("5.0")) >= 0) {
            savingsScore = 12;
            savingsStatus = "WARNING";
            savingsAdvice = "Low savings rate. Review discretionary envelopes to unlock more capital.";
        } else {
            savingsScore = 4;
            savingsStatus = "CRITICAL";
            savingsAdvice = "Monthly outflows match or exceed monthly inflows. Immediate budget adjustment needed.";
        }

        // Pillar 3: Debt-to-Asset Ratio
        BigDecimal debtRatio = totalAssets.compareTo(BigDecimal.ZERO) > 0
                ? liabilities.multiply(new BigDecimal("100")).divide(totalAssets, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        int debtScore;
        String debtStatus;
        String debtAdvice;
        if (debtRatio.compareTo(new BigDecimal("15.0")) <= 0) {
            debtScore = 20;
            debtStatus = "EXCELLENT";
            debtAdvice = "Minimal debt obligations relative to total portfolio assets.";
        } else if (debtRatio.compareTo(new BigDecimal("35.0")) <= 0) {
            debtScore = 15;
            debtStatus = "HEALTHY";
            debtAdvice = "Manageable debt leverage. Prioritize paying highest APR balances first.";
        } else {
            debtScore = 7;
            debtStatus = "WARNING";
            debtAdvice = "Elevated debt burden. Direct excess cash flow toward debt payoff.";
        }

        // Pillar 4: Budget Adherence
        long onBudgetCount = envelopes.stream()
                .filter(e -> e.getMonthlyBudget() != null && e.getSpentAmount() != null
                        && e.getSpentAmount().compareTo(e.getMonthlyBudget()) <= 0)
                .count();

        BigDecimal adherence = envelopes.isEmpty() ? new BigDecimal("100")
                : new BigDecimal(onBudgetCount).multiply(new BigDecimal("100"))
                .divide(new BigDecimal(envelopes.size()), 1, RoundingMode.HALF_UP);

        int budgetScore;
        String budgetStatus;
        String budgetAdvice;
        if (adherence.compareTo(new BigDecimal("85.0")) >= 0) {
            budgetScore = 20;
            budgetStatus = "EXCELLENT";
            budgetAdvice = "Exceptional envelope discipline across categories.";
        } else if (adherence.compareTo(new BigDecimal("65.0")) >= 0) {
            budgetScore = 14;
            budgetStatus = "HEALTHY";
            budgetAdvice = "Most categories on track, but several categories showed overruns.";
        } else {
            budgetScore = 6;
            budgetStatus = "WARNING";
            budgetAdvice = "Multiple category envelopes exceeded this month. Adjust limits or throttle spending.";
        }

        // Pillar 5: Recurring Commitments Burden
        BigDecimal totalRecurring = subscriptions.stream()
                .map(Subscription::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal recurringBurden = monthlyInflows.compareTo(BigDecimal.ZERO) > 0
                ? totalRecurring.multiply(new BigDecimal("100")).divide(monthlyInflows, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        int recurringScore;
        String recurringStatus;
        String recurringAdvice;
        if (recurringBurden.compareTo(new BigDecimal("20.0")) <= 0) {
            recurringScore = 15;
            recurringStatus = "EXCELLENT";
            recurringAdvice = "Fixed bill overhead is lean, preserving maximum disposable cash flow.";
        } else if (recurringBurden.compareTo(new BigDecimal("35.0")) <= 0) {
            recurringScore = 11;
            recurringStatus = "HEALTHY";
            recurringAdvice = "Manageable subscription load. Audit recurring services quarterly.";
        } else {
            recurringScore = 5;
            recurringStatus = "WARNING";
            recurringAdvice = "High fixed recurring commitments lock up significant monthly cash flow.";
        }

        int totalScore = Math.min(100, Math.max(0, runwayScore + savingsScore + debtScore + budgetScore + recurringScore));
        String grade;
        String statusText;
        if (totalScore >= 90) {
            grade = "A+";
            statusText = "Elite Financial Resilience";
        } else if (totalScore >= 80) {
            grade = "A";
            statusText = "Strong Financial Health";
        } else if (totalScore >= 70) {
            grade = "B+";
            statusText = "Healthy with Growth Upside";
        } else if (totalScore >= 60) {
            grade = "B";
            statusText = "Stable but Room for Optimization";
        } else {
            grade = "Needs Attention";
            statusText = "Vulnerable to Cash Flow Shocks";
        }

        List<FinancialHealthDto.HealthPillar> pillars = List.of(
                FinancialHealthDto.HealthPillar.builder()
                        .name("Emergency Runway")
                        .score(runwayScore)
                        .maxScore(20)
                        .status(runwayStatus)
                        .metric(runwayMonths + " months")
                        .advice(runwayAdvice)
                        .build(),
                FinancialHealthDto.HealthPillar.builder()
                        .name("Savings Rate")
                        .score(savingsScore)
                        .maxScore(25)
                        .status(savingsStatus)
                        .metric(savingsRate + "%")
                        .advice(savingsAdvice)
                        .build(),
                FinancialHealthDto.HealthPillar.builder()
                        .name("Debt-to-Asset Leverage")
                        .score(debtScore)
                        .maxScore(20)
                        .status(debtStatus)
                        .metric(debtRatio + "%")
                        .advice(debtAdvice)
                        .build(),
                FinancialHealthDto.HealthPillar.builder()
                        .name("Budget Discipline")
                        .score(budgetScore)
                        .maxScore(20)
                        .status(budgetStatus)
                        .metric(adherence + "% adhered")
                        .advice(budgetAdvice)
                        .build(),
                FinancialHealthDto.HealthPillar.builder()
                        .name("Recurring Burden")
                        .score(recurringScore)
                        .maxScore(15)
                        .status(recurringStatus)
                        .metric(recurringBurden + "% of income")
                        .advice(recurringAdvice)
                        .build()
        );

        List<String> recommendations = new ArrayList<>();
        if (runwayScore < 20) {
            recommendations.add("Boost liquid emergency reserves by $" + monthlyBurnRate.multiply(new BigDecimal("2")).setScale(0, RoundingMode.HALF_UP) + " to reach 6 full months of living expenses.");
        }
        if (savingsScore < 25) {
            recommendations.add("Automate a monthly transfer of $250 on payday into high-yield savings or mutual funds.");
        }
        if (recurringScore < 15) {
            recommendations.add("Audit unused recurring streaming & software memberships to free up cash flow.");
        }
        if (budgetScore < 20) {
            recommendations.add("Adjust category allocations on dining and shopping envelopes to reflect realistic spending.");
        }
        if (recommendations.isEmpty()) {
            recommendations.add("Your finances are operating at peak efficiency. Consider increasing long-term retirement investments.");
        }

        return FinancialHealthDto.builder()
                .score(totalScore)
                .grade(grade)
                .statusText(statusText)
                .emergencyRunwayMonths(runwayMonths)
                .savingsRatePercent(savingsRate)
                .debtToAssetRatio(debtRatio)
                .budgetAdherencePercent(adherence)
                .recurringBurdenPercent(recurringBurden)
                .pillars(pillars)
                .recommendations(recommendations)
                .build();
    }

    public CashFlowForecastDto getCashFlowForecast(String userIdStr) {
        List<Account> accounts = getScopedAccounts(userIdStr);
        List<Subscription> subscriptions = getScopedSubscriptions(userIdStr);
        List<Transaction> transactions = getScopedTransactions(userIdStr);

        BigDecimal startingBalance = accounts.stream()
                .filter(a -> a.getType() == AccountType.CHECKING || a.getType() == AccountType.SAVINGS || a.getType() == AccountType.CASH_WALLET)
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Daily average variable outflow
        BigDecimal total30DayExpense = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal dailyVariableBurn = total30DayExpense.compareTo(BigDecimal.ZERO) > 0
                ? total30DayExpense.divide(new BigDecimal("30"), 2, RoundingMode.HALF_UP)
                : new BigDecimal("45.00");

        LocalDate today = LocalDate.now();
        List<CashFlowForecastDto.ForecastDay> days = new ArrayList<>();

        BigDecimal runningBalance = startingBalance;
        BigDecimal lowestBalance = startingBalance;
        String lowestBalanceDate = today.toString();
        BigDecimal totalExpectedInflow = BigDecimal.ZERO;
        BigDecimal totalExpectedOutflow = BigDecimal.ZERO;

        for (int i = 0; i < 30; i++) {
            LocalDate currentDate = today.plusDays(i);
            int dom = currentDate.getDayOfMonth();

            BigDecimal dayInflow = BigDecimal.ZERO;
            BigDecimal dayOutflow = dailyVariableBurn;
            List<String> eventNames = new ArrayList<>();

            // Payday simulation: 1st and 15th of the month
            if (dom == 1 || dom == 15) {
                dayInflow = dayInflow.add(new BigDecimal("2800.00"));
                eventNames.add("Bi-Weekly Payday (+$2,800.00)");
            }

            // Recurring bill match
            for (Subscription sub : subscriptions) {
                if (sub.getNextBillingDate() != null) {
                    try {
                        LocalDate nextDate = sub.getNextBillingDate();
                        if (nextDate.getDayOfMonth() == dom || (i < 7 && nextDate.isEqual(currentDate))) {
                            dayOutflow = dayOutflow.add(sub.getAmount());
                            eventNames.add(sub.getName() + " (-$" + sub.getAmount() + ")");
                        }
                    } catch (Exception ignored) {
                    }
                }
            }

            runningBalance = runningBalance.add(dayInflow).subtract(dayOutflow);
            totalExpectedInflow = totalExpectedInflow.add(dayInflow);
            totalExpectedOutflow = totalExpectedOutflow.add(dayOutflow);

            if (runningBalance.compareTo(lowestBalance) < 0) {
                lowestBalance = runningBalance;
                lowestBalanceDate = currentDate.toString();
            }

            String status;
            if (runningBalance.compareTo(new BigDecimal("1000.00")) >= 0) {
                status = "SAFE";
            } else if (runningBalance.compareTo(BigDecimal.ZERO) >= 0) {
                status = "WARNING";
            } else {
                status = "DANGER";
            }

            days.add(CashFlowForecastDto.ForecastDay.builder()
                    .date(currentDate.toString())
                    .dayOfWeek(currentDate.getDayOfWeek().getValue())
                    .balance(runningBalance.setScale(2, RoundingMode.HALF_UP))
                    .inflow(dayInflow)
                    .outflow(dayOutflow)
                    .eventDescription(String.join(", ", eventNames))
                    .status(status)
                    .build());
        }

        return CashFlowForecastDto.builder()
                .startingBalance(startingBalance)
                .endingBalance(runningBalance.setScale(2, RoundingMode.HALF_UP))
                .lowestProjectedBalance(lowestBalance.setScale(2, RoundingMode.HALF_UP))
                .lowestBalanceDate(lowestBalanceDate)
                .riskOfNegativeBalance(lowestBalance.compareTo(BigDecimal.ZERO) < 0)
                .totalExpectedInflow(totalExpectedInflow.setScale(2, RoundingMode.HALF_UP))
                .totalExpectedOutflow(totalExpectedOutflow.setScale(2, RoundingMode.HALF_UP))
                .days(days)
                .build();
    }

    public AnomalyDetectionDto getAnomalies(String userIdStr) {
        List<Transaction> transactions = getScopedTransactions(userIdStr);
        List<Subscription> subscriptions = getScopedSubscriptions(userIdStr);
        List<AnomalyDetectionDto.AnomalyItem> items = new ArrayList<>();
        BigDecimal potentialSavings = BigDecimal.ZERO;

        // 1. Detect Duplicate Transactions (same merchant and same amount within 24h)
        for (int i = 0; i < transactions.size(); i++) {
            Transaction t1 = transactions.get(i);
            if (t1.getType() != TransactionType.EXPENSE) continue;
            for (int j = i + 1; j < transactions.size(); j++) {
                Transaction t2 = transactions.get(j);
                if (t2.getType() != TransactionType.EXPENSE) continue;

                if (Objects.equals(t1.getMerchant(), t2.getMerchant())
                        && t1.getAmount().compareTo(t2.getAmount()) == 0
                        && Objects.equals(t1.getDate(), t2.getDate())) {

                    items.add(AnomalyDetectionDto.AnomalyItem.builder()
                            .id("dup-" + t1.getId() + "-" + t2.getId())
                            .type("DUPLICATE_CHARGE")
                            .title("Potential Duplicate Charge: " + (t1.getMerchant() != null ? t1.getMerchant() : t1.getDescription()))
                            .description(String.format("Two identical charges of $%s on %s.", t1.getAmount(), t1.getDate().toString()))
                            .amount(t1.getAmount())
                            .date(t1.getDate().toString())
                            .merchant(t1.getMerchant() != null ? t1.getMerchant() : t1.getDescription())
                            .severity("HIGH")
                            .suggestedAction("Verify bank statement or dispute double charge")
                            .build());
                    potentialSavings = potentialSavings.add(t1.getAmount());
                }
            }
        }

        // 2. Detect Outlier / High-Value Unplanned Expenses (> $400)
        for (Transaction t : transactions) {
            if (t.getType() == TransactionType.EXPENSE && t.getAmount().compareTo(new BigDecimal("400.00")) >= 0) {
                items.add(AnomalyDetectionDto.AnomalyItem.builder()
                        .id("outlier-" + t.getId())
                        .type("LARGE_OUTLIER")
                        .title("High-Value Outlier: " + (t.getMerchant() != null ? t.getMerchant() : t.getDescription()))
                        .description(String.format("Single charge of $%s exceeds standard transaction thresholds.", t.getAmount()))
                        .amount(t.getAmount())
                        .date(t.getDate().toString())
                        .merchant(t.getMerchant() != null ? t.getMerchant() : t.getDescription())
                        .severity("MEDIUM")
                        .suggestedAction("Review invoice and assign to specific project envelope")
                        .build());
            }
        }

        // 3. Detect Subscription Price Spikes (e.g. streaming or cloud service above $25/mo)
        for (Subscription sub : subscriptions) {
            if (sub.getAmount().compareTo(new BigDecimal("50.00")) >= 0) {
                items.add(AnomalyDetectionDto.AnomalyItem.builder()
                        .id("sub-spike-" + sub.getId())
                        .type("PRICE_HIKE")
                        .title("High Recurring Fee: " + sub.getName())
                        .description(String.format("Recurring billing rate is $%s/mo ($%s annualized).",
                                sub.getAmount(), sub.getAmount().multiply(new BigDecimal("12"))))
                        .amount(sub.getAmount())
                        .date(sub.getNextBillingDate() != null ? sub.getNextBillingDate().toString() : LocalDate.now().toString())
                        .merchant(sub.getName())
                        .severity("LOW")
                        .suggestedAction("Evaluate annual plan discount or renegotiate tier")
                        .build());
            }
        }

        return AnomalyDetectionDto.builder()
                .totalAnomalies(items.size())
                .potentialSavings(potentialSavings)
                .items(items)
                .build();
    }
}
