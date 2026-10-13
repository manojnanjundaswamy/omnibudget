package com.omnibudget.service;

import com.omnibudget.domain.*;
import com.omnibudget.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SandboxDataService {

    private final AccountRepository accountRepository;
    private final BudgetEnvelopeRepository envelopeRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionSplitRepository splitRepository;
    private final SplitGroupRepository groupRepository;
    private final PeerDebtRepository peerDebtRepository;
    private final HouseholdRepository householdRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;

    @PostConstruct
    public void initOnStartup() {
        if (accountRepository.count() == 0) {
            log.info("OmniBudget database empty: preloading realistic sandbox seed dataset...");
            resetToDemoData();
        }
    }

    @Transactional
    public void resetToDemoData() {
        splitRepository.deleteAll();
        peerDebtRepository.deleteAll();
        transactionRepository.deleteAll();
        envelopeRepository.deleteAll();
        accountRepository.deleteAll();
        groupRepository.deleteAll();
        householdRepository.deleteAll();
        subscriptionRepository.deleteAll();
        goalRepository.deleteAll();

        // Seed demo user
        if (!userRepository.existsByEmail("demo@omnibudget.app")) {
            userRepository.save(User.builder()
                    .email("demo@omnibudget.app")
                    .name("Alex Chen (Demo)")
                    .provider("DEMO")
                    .currency("USD")
                    .hasCompletedOnboarding(true)
                    .build());
        }

        // 1. ACCOUNTS
        Account checking = Account.builder()
                .name("Chase Premier Checking")
                .type(AccountType.CHECKING)
                .balance(new BigDecimal("4850.00"))
                .currency("USD")
                .institutionName("JPMorgan Chase")
                .accountNumberLast4("4182")
                .color("#3b82f6")
                .icon("building-2")
                .build();

        Account hysa = Account.builder()
                .name("Marcus High-Yield Savings")
                .type(AccountType.SAVINGS)
                .balance(new BigDecimal("14200.00"))
                .currency("USD")
                .institutionName("Goldman Sachs")
                .accountNumberLast4("8831")
                .color("#10b981")
                .icon("vault")
                .build();

        Account creditCard = Account.builder()
                .name("Amex Gold Rewards")
                .type(AccountType.CREDIT_CARD)
                .balance(new BigDecimal("-680.00"))
                .currency("USD")
                .institutionName("American Express")
                .accountNumberLast4("1094")
                .creditLimit(new BigDecimal("15000.00"))
                .apr(new BigDecimal("21.99"))
                .statementClosingDay(18)
                .paymentDueDay(12)
                .color("#f59e0b")
                .icon("credit-card")
                .build();

        Account cash = Account.builder()
                .name("Apple Cash & Physical Wallet")
                .type(AccountType.CASH_WALLET)
                .balance(new BigDecimal("150.00"))
                .currency("USD")
                .institutionName("Apple / Cash")
                .accountNumberLast4("0000")
                .color("#6366f1")
                .icon("wallet")
                .build();

        Account vanguard = Account.builder()
                .name("Vanguard Total Market Index")
                .type(AccountType.INVESTMENT)
                .balance(new BigDecimal("28500.00"))
                .currency("USD")
                .institutionName("Vanguard")
                .accountNumberLast4("9012")
                .color("#8b5cf6")
                .icon("trending-up")
                .build();

        List<Account> savedAccounts = accountRepository.saveAll(List.of(checking, hysa, creditCard, cash, vanguard));
        Account chkAcc = savedAccounts.get(0);
        Account cardAcc = savedAccounts.get(2);

        // 2. BUDGET ENVELOPES (50/30/20)
        BudgetEnvelope rent = BudgetEnvelope.builder()
                .name("Housing & Rent")
                .groupType(EnvelopeGroup.NEEDS)
                .targetRatio(new BigDecimal("0.3000"))
                .monthlyBudget(new BigDecimal("1800.00"))
                .spentAmount(new BigDecimal("1800.00"))
                .icon("home")
                .color("#3b82f6")
                .build();

        BudgetEnvelope groceries = BudgetEnvelope.builder()
                .name("Groceries & Farmers Market")
                .groupType(EnvelopeGroup.NEEDS)
                .targetRatio(new BigDecimal("0.1200"))
                .monthlyBudget(new BigDecimal("600.00"))
                .spentAmount(new BigDecimal("410.00"))
                .icon("shopping-cart")
                .color("#10b981")
                .build();

        BudgetEnvelope utilities = BudgetEnvelope.builder()
                .name("Utilities, Fiber & Power")
                .groupType(EnvelopeGroup.NEEDS)
                .targetRatio(new BigDecimal("0.0800"))
                .monthlyBudget(new BigDecimal("250.00"))
                .spentAmount(new BigDecimal("195.00"))
                .icon("zap")
                .color("#06b6d4")
                .build();

        BudgetEnvelope dining = BudgetEnvelope.builder()
                .name("Dining Out & Coffee")
                .groupType(EnvelopeGroup.WANTS)
                .targetRatio(new BigDecimal("0.1500"))
                .monthlyBudget(new BigDecimal("450.00"))
                .spentAmount(new BigDecimal("290.00"))
                .icon("utensils")
                .color("#f59e0b")
                .build();

        BudgetEnvelope entertainment = BudgetEnvelope.builder()
                .name("Entertainment & Streaming")
                .groupType(EnvelopeGroup.WANTS)
                .targetRatio(new BigDecimal("0.0700"))
                .monthlyBudget(new BigDecimal("180.00"))
                .spentAmount(new BigDecimal("95.00"))
                .icon("film")
                .color("#ec4899")
                .build();

        BudgetEnvelope shopping = BudgetEnvelope.builder()
                .name("Personal Shopping & Gear")
                .groupType(EnvelopeGroup.WANTS)
                .targetRatio(new BigDecimal("0.0800"))
                .monthlyBudget(new BigDecimal("300.00"))
                .spentAmount(new BigDecimal("140.00"))
                .icon("shopping-bag")
                .color("#8b5cf6")
                .build();

        BudgetEnvelope emergencyFund = BudgetEnvelope.builder()
                .name("Emergency Fund Sweep")
                .groupType(EnvelopeGroup.SAVINGS_AND_DEBT)
                .targetRatio(new BigDecimal("0.1200"))
                .monthlyBudget(new BigDecimal("500.00"))
                .spentAmount(new BigDecimal("500.00"))
                .icon("shield-check")
                .color("#14b8a6")
                .build();

        BudgetEnvelope travelVault = BudgetEnvelope.builder()
                .name("Japan Trip Travel Vault")
                .groupType(EnvelopeGroup.SAVINGS_AND_DEBT)
                .targetRatio(new BigDecimal("0.0800"))
                .monthlyBudget(new BigDecimal("350.00"))
                .spentAmount(new BigDecimal("150.00"))
                .icon("plane")
                .color("#6366f1")
                .build();

        List<BudgetEnvelope> savedEnvelopes = envelopeRepository.saveAll(List.of(
                rent, groceries, utilities, dining, entertainment, shopping, emergencyFund, travelVault
        ));

        // 3. SPLIT GROUP & PEER DEBTS
        SplitGroup tahoeTrip = SplitGroup.builder()
                .name("Lake Tahoe Ski Cabin Trip")
                .description("Cabin booking, shared rental SUV, dinners and groceries")
                .members("You,Liam,Emma,Carlos")
                .totalExpenses(new BigDecimal("960.00"))
                .build();
        SplitGroup savedGroup = groupRepository.save(tahoeTrip);

        PeerDebt debt1 = PeerDebt.builder()
                .splitGroupId(savedGroup.getId())
                .fromUser("Liam")
                .toUser("You")
                .amount(new BigDecimal("120.00"))
                .build();

        PeerDebt debt2 = PeerDebt.builder()
                .splitGroupId(savedGroup.getId())
                .fromUser("Emma")
                .toUser("You")
                .amount(new BigDecimal("85.00"))
                .build();

        PeerDebt debt3 = PeerDebt.builder()
                .splitGroupId(savedGroup.getId())
                .fromUser("You")
                .toUser("Carlos")
                .amount(new BigDecimal("40.00"))
                .build();

        peerDebtRepository.saveAll(List.of(debt1, debt2, debt3));

        // 4. HOUSEHOLD POOL
        Household household = Household.builder()
                .name("The Miller Household")
                .partnerAName("You (Alex)")
                .partnerBName("Jordan (Partner)")
                .partnerASalary(new BigDecimal("6000.00"))
                .partnerBSalary(new BigDecimal("4000.00"))
                .partnerARatio(new BigDecimal("0.6000"))
                .partnerBRatio(new BigDecimal("0.4000"))
                .jointMonthlyTarget(new BigDecimal("4200.00"))
                .jointPoolBalance(new BigDecimal("2150.00"))
                .dependentName("Leo (Kid)")
                .dependentAllowance(new BigDecimal("120.00"))
                .dependentBalance(new BigDecimal("45.00"))
                .build();
        householdRepository.save(household);

        // 5. SUBSCRIPTIONS
        Subscription s1 = Subscription.builder()
                .name("Netflix 4K Ultra")
                .amount(new BigDecimal("22.99"))
                .cadence("MONTHLY")
                .category("Entertainment")
                .nextBillingDate(LocalDate.now().plusDays(8))
                .accountId(cardAcc.getId())
                .accountName(cardAcc.getName())
                .build();

        Subscription s2 = Subscription.builder()
                .name("Spotify Premium Duo")
                .amount(new BigDecimal("14.99"))
                .cadence("MONTHLY")
                .category("Entertainment")
                .nextBillingDate(LocalDate.now().plusDays(14))
                .accountId(cardAcc.getId())
                .accountName(cardAcc.getName())
                .build();

        Subscription s3 = Subscription.builder()
                .name("Equinox Sports Club")
                .amount(new BigDecimal("180.00"))
                .cadence("MONTHLY")
                .category("Health & Fitness")
                .nextBillingDate(LocalDate.now().plusDays(4))
                .accountId(chkAcc.getId())
                .accountName(chkAcc.getName())
                .build();

        Subscription s4 = Subscription.builder()
                .name("Claude Pro & AI Tools")
                .amount(new BigDecimal("20.00"))
                .cadence("MONTHLY")
                .category("Productivity")
                .nextBillingDate(LocalDate.now().plusDays(19))
                .accountId(cardAcc.getId())
                .accountName(cardAcc.getName())
                .build();

        subscriptionRepository.saveAll(List.of(s1, s2, s3, s4));

        // 6. REALISTIC HISTORICAL TRANSACTIONS
        LocalDate today = LocalDate.now();

        Transaction tx1 = Transaction.builder()
                .accountId(chkAcc.getId())
                .accountName(chkAcc.getName())
                .amount(new BigDecimal("4500.00"))
                .grossAmount(new BigDecimal("4500.00"))
                .netPersonalAmount(new BigDecimal("4500.00"))
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.INCOME)
                .category("Salary")
                .merchant("Stripe Inc (Payroll)")
                .description("Bi-weekly Engineering Payroll Direct Deposit")
                .date(today.minusDays(12))
                .status(TransactionStatus.CLEARED)
                .build();

        Transaction tx2 = Transaction.builder()
                .accountId(cardAcc.getId())
                .accountName(cardAcc.getName())
                .amount(new BigDecimal("-145.50"))
                .grossAmount(new BigDecimal("145.50"))
                .netPersonalAmount(new BigDecimal("-145.50"))
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.EXPENSE)
                .category("Groceries")
                .envelopeId(savedEnvelopes.get(1).getId())
                .envelopeName(savedEnvelopes.get(1).getName())
                .merchant("Whole Foods Market")
                .description("Organic produce, salmon, olive oil, oat milk")
                .date(today.minusDays(2))
                .status(TransactionStatus.CLEARED)
                .build();

        // SPLIT BILL: User paid $180 at Nobu for dinner with Liam & Emma
        // User's dining envelope is debited only $60! $120 is receivable IOU!
        Transaction tx3 = Transaction.builder()
                .accountId(cardAcc.getId())
                .accountName(cardAcc.getName())
                .amount(new BigDecimal("-180.00"))
                .grossAmount(new BigDecimal("180.00"))
                .netPersonalAmount(new BigDecimal("-60.00"))
                .receivableAmount(new BigDecimal("120.00"))
                .type(TransactionType.EXPENSE)
                .category("Dining")
                .envelopeId(savedEnvelopes.get(3).getId())
                .envelopeName(savedEnvelopes.get(3).getName())
                .merchant("Nobu Japanese Dining")
                .description("Dinner fronted for 3 people (Split with Liam and Emma)")
                .date(today.minusDays(4))
                .status(TransactionStatus.CLEARED)
                .splitGroupId(savedGroup.getId())
                .splitGroupName(savedGroup.getName())
                .build();

        Transaction tx4 = Transaction.builder()
                .accountId(chkAcc.getId())
                .accountName(chkAcc.getName())
                .amount(new BigDecimal("-1800.00"))
                .grossAmount(new BigDecimal("1800.00"))
                .netPersonalAmount(new BigDecimal("-1800.00"))
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.EXPENSE)
                .category("Housing")
                .envelopeId(savedEnvelopes.get(0).getId())
                .envelopeName(savedEnvelopes.get(0).getName())
                .merchant("Avalon Bay Communities")
                .description("Apartment Monthly Rent Wire")
                .date(today.minusDays(10))
                .status(TransactionStatus.CLEARED)
                .build();

        Transaction tx5 = Transaction.builder()
                .accountId(cardAcc.getId())
                .accountName(cardAcc.getName())
                .amount(new BigDecimal("-34.20"))
                .grossAmount(new BigDecimal("34.20"))
                .netPersonalAmount(new BigDecimal("-34.20"))
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.EXPENSE)
                .category("Dining")
                .envelopeId(savedEnvelopes.get(3).getId())
                .envelopeName(savedEnvelopes.get(3).getName())
                .merchant("Blue Bottle Coffee")
                .description("Espresso drinks and morning pastries")
                .date(today.minusDays(1))
                .status(TransactionStatus.CLEARED)
                .build();

        Transaction tx6 = Transaction.builder()
                .accountId(chkAcc.getId())
                .accountName(chkAcc.getName())
                .amount(new BigDecimal("-500.00"))
                .grossAmount(new BigDecimal("500.00"))
                .netPersonalAmount(new BigDecimal("-500.00"))
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.TRANSFER)
                .category("Savings")
                .envelopeId(savedEnvelopes.get(6).getId())
                .envelopeName(savedEnvelopes.get(6).getName())
                .merchant("Marcus HYSA")
                .description("Automated Paycheck Emergency Fund Sweep")
                .date(today.minusDays(11))
                .status(TransactionStatus.CLEARED)
                .build();

        Transaction tx7 = Transaction.builder()
                .accountId(cardAcc.getId())
                .accountName(cardAcc.getName())
                .amount(new BigDecimal("-82.10"))
                .grossAmount(new BigDecimal("82.10"))
                .netPersonalAmount(new BigDecimal("-82.10"))
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.EXPENSE)
                .category("Shopping")
                .envelopeId(savedEnvelopes.get(5).getId())
                .envelopeName(savedEnvelopes.get(5).getName())
                .merchant("Patagonia")
                .description("Waterproof trail jacket on sale")
                .date(today.minusDays(6))
                .status(TransactionStatus.CLEARED)
                .build();

        transactionRepository.saveAll(List.of(tx1, tx2, tx3, tx4, tx5, tx6, tx7));

        // 7. FINANCIAL GOALS (Monarch-Style Moat Milestones)
        Goal g1 = Goal.builder()
                .userId("demo-user-id")
                .name("6-Month Emergency Reserve")
                .targetAmount(new BigDecimal("20000.00"))
                .currentAmount(new BigDecimal("14200.00"))
                .category("EMERGENCY")
                .targetDate(LocalDate.now().plusMonths(8))
                .color("#10b981")
                .icon("shield-check")
                .build();

        Goal g2 = Goal.builder()
                .userId("demo-user-id")
                .name("Home Down Payment Fund")
                .targetAmount(new BigDecimal("60000.00"))
                .currentAmount(new BigDecimal("28500.00"))
                .category("HOME")
                .targetDate(LocalDate.now().plusYears(2))
                .color("#3b82f6")
                .icon("home")
                .build();

        Goal g3 = Goal.builder()
                .userId("demo-user-id")
                .name("Tokyo & Kyoto Vacation 2027")
                .targetAmount(new BigDecimal("5000.00"))
                .currentAmount(new BigDecimal("3200.00"))
                .category("VACATION")
                .targetDate(LocalDate.now().plusMonths(14))
                .color("#f59e0b")
                .icon("plane")
                .build();

        goalRepository.saveAll(List.of(g1, g2, g3));

        log.info("Sandbox demo dataset initialized successfully!");
    }

    /**
     * Simulate live paycheck arrival
     */
    @Transactional
    public Transaction simulatePaycheck() {
        List<Account> accounts = accountRepository.findByIsActiveTrueOrderByCreatedAtAsc();
        Account target = accounts.stream()
                .filter(a -> a.getType() == AccountType.CHECKING)
                .findFirst()
                .orElse(accounts.get(0));

        BigDecimal paycheck = new BigDecimal("4500.00");
        target.setBalance(target.getBalance().add(paycheck));
        accountRepository.save(target);

        Transaction tx = Transaction.builder()
                .accountId(target.getId())
                .accountName(target.getName())
                .amount(paycheck)
                .grossAmount(paycheck)
                .netPersonalAmount(paycheck)
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.INCOME)
                .category("Salary")
                .merchant("Stripe Inc (Payroll)")
                .description("Live Simulated Bi-weekly Payroll Deposit")
                .date(LocalDate.now())
                .status(TransactionStatus.CLEARED)
                .build();
        return transactionRepository.save(tx);
    }

    /**
     * Simulate random daily expense
     */
    @Transactional
    public Transaction simulateRandomExpense() {
        List<Account> accounts = accountRepository.findByIsActiveTrueOrderByCreatedAtAsc();
        Account target = accounts.get(new Random().nextInt(Math.min(accounts.size(), 3)));

        String[] merchants = {"Trader Joe's", "Blue Bottle Coffee", "Uber Ride", "Target Superstore", "Sweetgreen"};
        String[] categories = {"Groceries", "Dining", "Transport", "Shopping", "Dining"};
        BigDecimal[] amounts = {
                new BigDecimal("68.40"),
                new BigDecimal("12.50"),
                new BigDecimal("28.75"),
                new BigDecimal("54.10"),
                new BigDecimal("19.80")
        };

        int idx = new Random().nextInt(merchants.length);
        BigDecimal amt = amounts[idx];

        target.setBalance(target.getBalance().subtract(amt));
        accountRepository.save(target);

        Transaction tx = Transaction.builder()
                .accountId(target.getId())
                .accountName(target.getName())
                .amount(amt.negate())
                .grossAmount(amt)
                .netPersonalAmount(amt.negate())
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.EXPENSE)
                .category(categories[idx])
                .merchant(merchants[idx])
                .description("Simulated real-time card charge at " + merchants[idx])
                .date(LocalDate.now())
                .status(TransactionStatus.CLEARED)
                .build();
        return transactionRepository.save(tx);
    }
}
