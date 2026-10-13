package com.omnibudget.service;

import com.omnibudget.domain.*;
import com.omnibudget.dto.*;
import com.omnibudget.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionSplitRepository splitRepository;
    private final BudgetEnvelopeRepository envelopeRepository;
    private final SplitGroupRepository groupRepository;
    private final PeerDebtRepository peerDebtRepository;

    public List<Account> getAllAccounts() {
        return accountRepository.findByIsActiveTrueOrderByCreatedAtAsc();
    }

    public Account getAccountById(UUID id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + id));
    }

    @Transactional
    public Account createAccount(CreateAccountRequest req) {
        Account account = Account.builder()
                .name(req.getName())
                .type(req.getType())
                .balance(req.getBalance() != null ? req.getBalance() : BigDecimal.ZERO)
                .currency(req.getCurrency() != null ? req.getCurrency() : "USD")
                .institutionName(req.getInstitutionName())
                .accountNumberLast4(req.getAccountNumberLast4())
                .creditLimit(req.getCreditLimit())
                .apr(req.getApr())
                .statementClosingDay(req.getStatementClosingDay())
                .paymentDueDay(req.getPaymentDueDay())
                .color(req.getColor() != null ? req.getColor() : "#6366f1")
                .icon(req.getIcon() != null ? req.getIcon() : "wallet")
                .isActive(true)
                .build();
        return accountRepository.save(account);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByDateDescCreatedAtDesc();
    }

    public List<Transaction> getTransactionsByAccount(UUID accountId) {
        return transactionRepository.findByAccountIdOrderByDateDescCreatedAtDesc(accountId);
    }

    public List<Transaction> getTransactionsByGroup(UUID groupId) {
        return transactionRepository.findBySplitGroupIdOrderByDateDescCreatedAtDesc(groupId);
    }

    /**
     * Internal Account-to-Account Transfer
     */
    @Transactional
    public void executeTransfer(TransferRequest req) {
        Account source = getAccountById(req.getSourceAccountId());
        Account target = getAccountById(req.getTargetAccountId());

        BigDecimal amount = req.getAmount().abs();

        // Source account debited
        source.setBalance(source.getBalance().subtract(amount));
        accountRepository.save(source);

        // Target account credited
        target.setBalance(target.getBalance().add(amount));
        accountRepository.save(target);

        // Record twin transactions for double-entry ledger clarity
        Transaction outflow = Transaction.builder()
                .accountId(source.getId())
                .accountName(source.getName())
                .amount(amount.negate())
                .grossAmount(amount)
                .netPersonalAmount(amount.negate())
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.TRANSFER)
                .category("Transfer")
                .merchant(target.getName())
                .description("Transfer to " + target.getName() + ": " + (req.getDescription() != null ? req.getDescription() : ""))
                .date(req.getDate() != null ? req.getDate() : LocalDate.now())
                .status(TransactionStatus.CLEARED)
                .build();
        transactionRepository.save(outflow);

        Transaction inflow = Transaction.builder()
                .accountId(target.getId())
                .accountName(target.getName())
                .amount(amount)
                .grossAmount(amount)
                .netPersonalAmount(amount)
                .receivableAmount(BigDecimal.ZERO)
                .type(TransactionType.TRANSFER)
                .category("Transfer")
                .merchant(source.getName())
                .description("Transfer from " + source.getName() + ": " + (req.getDescription() != null ? req.getDescription() : ""))
                .date(req.getDate() != null ? req.getDate() : LocalDate.now())
                .status(TransactionStatus.CLEARED)
                .build();
        transactionRepository.save(inflow);
    }

    /**
     * Primary Transaction Ingestion with the "Split-to-Budget" Invariant
     */
    @Transactional
    public Transaction recordTransaction(CreateTransactionRequest req) {
        Account account = getAccountById(req.getAccountId());
        BigDecimal totalGross = req.getAmount().abs();
        BigDecimal signedAccountImpact = (req.getType() == TransactionType.INCOME) ? totalGross : totalGross.negate();

        // 1. Update Account Balance
        account.setBalance(account.getBalance().add(signedAccountImpact));
        accountRepository.save(account);

        // 2. Compute Envelope Impact & Receivables (Split-to-Budget Invariant)
        BigDecimal netPersonalShare = signedAccountImpact;
        BigDecimal receivableAmount = BigDecimal.ZERO;
        String groupName = null;

        if (req.getSplitGroupId() != null) {
            SplitGroup group = groupRepository.findById(req.getSplitGroupId()).orElse(null);
            if (group != null) {
                groupName = group.getName();
                group.setTotalExpenses(group.getTotalExpenses().add(totalGross));
                groupRepository.save(group);
            }
        }

        // Handle Splits if present
        List<CreateTransactionRequest.SplitItemDto> splits = new ArrayList<>();
        if (req.getCustomSplits() != null && !req.getCustomSplits().isEmpty()) {
            splits.addAll(req.getCustomSplits());
        } else if (req.getSplitMembers() != null && !req.getSplitMembers().isEmpty()) {
            // Equal division
            int memberCount = req.getSplitMembers().size();
            BigDecimal perPerson = totalGross.divide(BigDecimal.valueOf(memberCount), 2, RoundingMode.HALF_UP);
            BigDecimal runningSum = BigDecimal.ZERO;

            for (int i = 0; i < memberCount; i++) {
                String member = req.getSplitMembers().get(i);
                boolean isPayer = (i == 0 || "You".equalsIgnoreCase(member) || "Me".equalsIgnoreCase(member));
                BigDecimal share = (i == memberCount - 1) ? totalGross.subtract(runningSum) : perPerson;
                runningSum = runningSum.add(share);

                splits.add(CreateTransactionRequest.SplitItemDto.builder()
                        .beneficiaryName(member)
                        .shareAmount(share)
                        .isPayer(isPayer)
                        .build());
            }
        }

        if (!splits.isEmpty()) {
            BigDecimal payerShare = BigDecimal.ZERO;
            for (var split : splits) {
                if (Boolean.TRUE.equals(split.getIsPayer())) {
                    payerShare = payerShare.add(split.getShareAmount());
                } else {
                    receivableAmount = receivableAmount.add(split.getShareAmount());
                }
            }
            // Personal budget is charged ONLY the payer's share!
            netPersonalShare = payerShare.negate();
        }

        // 3. Update Budget Envelope (Charge strictly the net personal share)
        String envelopeName = null;
        if (req.getEnvelopeId() != null && req.getType() == TransactionType.EXPENSE) {
            BudgetEnvelope envelope = envelopeRepository.findById(req.getEnvelopeId()).orElse(null);
            if (envelope != null) {
                envelopeName = envelope.getName();
                envelope.setSpentAmount(envelope.getSpentAmount().add(netPersonalShare.abs()));
                envelopeRepository.save(envelope);
            }
        }

        // 4. Persist Transaction
        Transaction tx = Transaction.builder()
                .accountId(account.getId())
                .accountName(account.getName())
                .amount(signedAccountImpact)
                .grossAmount(totalGross)
                .netPersonalAmount(netPersonalShare)
                .receivableAmount(receivableAmount)
                .type(req.getType())
                .category(req.getCategory() != null ? req.getCategory() : "General")
                .envelopeId(req.getEnvelopeId())
                .envelopeName(envelopeName)
                .merchant(req.getMerchant())
                .description(req.getDescription())
                .date(req.getDate() != null ? req.getDate() : LocalDate.now())
                .status(TransactionStatus.CLEARED)
                .isRecurring(Boolean.TRUE.equals(req.getIsRecurring()))
                .splitGroupId(req.getSplitGroupId())
                .splitGroupName(groupName)
                .build();
        Transaction savedTx = transactionRepository.save(tx);

        // 5. Persist Split records & Update Peer Debts
        if (!splits.isEmpty()) {
            for (var split : splits) {
                boolean isPayer = Boolean.TRUE.equals(split.getIsPayer());
                TransactionSplit splitEntity = TransactionSplit.builder()
                        .transactionId(savedTx.getId())
                        .beneficiaryName(split.getBeneficiaryName())
                        .shareAmount(split.getShareAmount())
                        .isPersonalLiability(isPayer)
                        .isReceivableAsset(!isPayer)
                        .isSettled(isPayer) // Payer share is immediately settled
                        .build();
                splitRepository.save(splitEntity);

                // If owed by someone else, record peer debt
                if (!isPayer) {
                    recordOrUpdatePeerDebt(req.getSplitGroupId(), split.getBeneficiaryName(), "You", split.getShareAmount());
                }
            }
        }

        return savedTx;
    }

    /**
     * Update or create a peer debt pair (debtor owes creditor)
     */
    private void recordOrUpdatePeerDebt(UUID groupId, String debtor, String creditor, BigDecimal amount) {
        Optional<PeerDebt> existing = peerDebtRepository.findByFromUserAndToUser(debtor, creditor);
        if (existing.isPresent()) {
            PeerDebt debt = existing.get();
            debt.setAmount(debt.getAmount().add(amount));
            peerDebtRepository.save(debt);
        } else {
            // Check reverse debt (creditor owed debtor)
            Optional<PeerDebt> reverse = peerDebtRepository.findByFromUserAndToUser(creditor, debtor);
            if (reverse.isPresent()) {
                PeerDebt revDebt = reverse.get();
                if (revDebt.getAmount().compareTo(amount) >= 0) {
                    revDebt.setAmount(revDebt.getAmount().subtract(amount));
                    peerDebtRepository.save(revDebt);
                } else {
                    BigDecimal remainder = amount.subtract(revDebt.getAmount());
                    peerDebtRepository.delete(revDebt);
                    PeerDebt newDebt = PeerDebt.builder()
                            .splitGroupId(groupId)
                            .fromUser(debtor)
                            .toUser(creditor)
                            .amount(remainder)
                            .build();
                    peerDebtRepository.save(newDebt);
                }
            } else {
                PeerDebt newDebt = PeerDebt.builder()
                        .splitGroupId(groupId)
                        .fromUser(debtor)
                        .toUser(creditor)
                        .amount(amount)
                        .build();
                peerDebtRepository.save(newDebt);
            }
        }
    }

    /**
     * Settle up peer debt
     */
    @Transactional
    public void settleDebt(SettlementRequest req) {
        BigDecimal amount = req.getAmount().abs();

        // If target account provided, credit it
        if (req.getTargetAccountId() != null) {
            Account account = getAccountById(req.getTargetAccountId());
            account.setBalance(account.getBalance().add(amount));
            accountRepository.save(account);

            Transaction settlementTx = Transaction.builder()
                    .accountId(account.getId())
                    .accountName(account.getName())
                    .amount(amount)
                    .grossAmount(amount)
                    .netPersonalAmount(amount)
                    .receivableAmount(BigDecimal.ZERO)
                    .type(TransactionType.SETTLEMENT)
                    .category("Settlement")
                    .merchant(req.getFromUser())
                    .description("Settlement payment from " + req.getFromUser() + " to " + req.getToUser())
                    .date(LocalDate.now())
                    .status(TransactionStatus.CLEARED)
                    .splitGroupId(req.getSplitGroupId())
                    .build();
            transactionRepository.save(settlementTx);
        }

        // Reduce debt
        Optional<PeerDebt> debtOpt = peerDebtRepository.findByFromUserAndToUser(req.getFromUser(), req.getToUser());
        if (debtOpt.isPresent()) {
            PeerDebt debt = debtOpt.get();
            if (debt.getAmount().compareTo(amount) <= 0) {
                peerDebtRepository.delete(debt);
            } else {
                debt.setAmount(debt.getAmount().subtract(amount));
                peerDebtRepository.save(debt);
            }
        }
    }

    /**
     * Calculate Complete Financial Dashboard Summary
     */
    public DashboardSummaryResponse getDashboardSummary() {
        List<Account> accounts = getAllAccounts();
        List<BudgetEnvelope> envelopes = envelopeRepository.findAll();

        BigDecimal liquid = BigDecimal.ZERO;
        BigDecimal liabilities = BigDecimal.ZERO;
        BigDecimal investments = BigDecimal.ZERO;

        for (Account acc : accounts) {
            if (acc.getType() == AccountType.CHECKING || acc.getType() == AccountType.CASH_WALLET || acc.getType() == AccountType.SAVINGS) {
                liquid = liquid.add(acc.getBalance());
            } else if (acc.getType() == AccountType.CREDIT_CARD) {
                // If credit card has negative balance or positive debt
                liabilities = liabilities.add(acc.getBalance().abs());
            } else if (acc.getType() == AccountType.INVESTMENT) {
                investments = investments.add(acc.getBalance());
            }
        }

        BigDecimal netWorth = liquid.add(investments).subtract(liabilities);

        // Safe-to-spend = liquid cash minus remaining committed envelope budgets
        BigDecimal committedRemaining = BigDecimal.ZERO;
        for (BudgetEnvelope env : envelopes) {
            if (env.getGroupType() == EnvelopeGroup.NEEDS) {
                BigDecimal remaining = env.getMonthlyBudget().subtract(env.getSpentAmount());
                if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                    committedRemaining = committedRemaining.add(remaining);
                }
            }
        }
        BigDecimal safeToSpend = liquid.subtract(committedRemaining);
        if (safeToSpend.compareTo(BigDecimal.ZERO) < 0) {
            safeToSpend = BigDecimal.ZERO;
        }

        // Active receivables (people owe "You")
        List<PeerDebt> allDebts = peerDebtRepository.findAll();
        BigDecimal totalReceivables = BigDecimal.ZERO;
        BigDecimal totalPayables = BigDecimal.ZERO;

        for (PeerDebt d : allDebts) {
            if ("You".equalsIgnoreCase(d.getToUser())) {
                totalReceivables = totalReceivables.add(d.getAmount());
            } else if ("You".equalsIgnoreCase(d.getFromUser())) {
                totalPayables = totalPayables.add(d.getAmount());
            }
        }

        // Calculate current month's income & expenses
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        List<Transaction> monthTxs = transactionRepository.findByDateBetweenOrderByDateDesc(startOfMonth, now);

        BigDecimal incomeMonth = BigDecimal.ZERO;
        BigDecimal expenseMonth = BigDecimal.ZERO;

        for (Transaction tx : monthTxs) {
            if (tx.getType() == TransactionType.INCOME) {
                incomeMonth = incomeMonth.add(tx.getAmount());
            } else if (tx.getType() == TransactionType.EXPENSE) {
                // Use netPersonalAmount to preserve split-to-budget integrity
                expenseMonth = expenseMonth.add(tx.getNetPersonalAmount().abs());
            }
        }

        String primaryCurrency = accounts.isEmpty() ? "USD" : accounts.get(0).getCurrency();

        return DashboardSummaryResponse.builder()
                .netWorth(netWorth)
                .totalLiquidAssets(liquid)
                .totalCreditLiabilities(liabilities)
                .totalInvestments(investments)
                .safeToSpend(safeToSpend)
                .totalIncomeThisMonth(incomeMonth)
                .totalExpensesThisMonth(expenseMonth)
                .totalReceivablesIOU(totalReceivables)
                .totalPayablesIOU(totalPayables)
                .currency(primaryCurrency)
                .accountCount(accounts.size())
                .envelopeCount(envelopes.size())
                .build();
    }
}
