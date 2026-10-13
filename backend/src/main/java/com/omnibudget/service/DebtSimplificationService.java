package com.omnibudget.service;

import com.omnibudget.domain.PeerDebt;
import com.omnibudget.dto.DebtSimplificationResponse;
import com.omnibudget.dto.DebtSimplificationResponse.SimplifiedDebtItem;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class DebtSimplificationService {

    /**
     * Greedy Debt Minimization Algorithm: O(V log V)
     * Compresses circular and transitive debts into minimal cash flow settlements.
     */
    public DebtSimplificationResponse simplify(List<PeerDebt> debts) {
        if (debts == null || debts.isEmpty()) {
            return DebtSimplificationResponse.builder()
                    .simplifiedPayments(Collections.emptyList())
                    .originalTransactionCount(0)
                    .simplifiedTransactionCount(0)
                    .totalDebtSettled(BigDecimal.ZERO)
                    .build();
        }

        // 1. Calculate net balances for each person
        Map<String, BigDecimal> netBalances = new HashMap<>();
        BigDecimal totalGross = BigDecimal.ZERO;

        for (PeerDebt debt : debts) {
            BigDecimal amt = debt.getAmount().setScale(2, RoundingMode.HALF_UP);
            totalGross = totalGross.add(amt);

            // fromUser owes money -> negative balance
            netBalances.put(debt.getFromUser(),
                    netBalances.getOrDefault(debt.getFromUser(), BigDecimal.ZERO).subtract(amt));

            // toUser is owed money -> positive balance
            netBalances.put(debt.getToUser(),
                    netBalances.getOrDefault(debt.getToUser(), BigDecimal.ZERO).add(amt));
        }

        // 2. Separate into Debtors and Creditors using Priority Queues
        // Debtor class holds positive magnitude of debt for max-heap
        record BalanceNode(String person, BigDecimal amount) {}

        PriorityQueue<BalanceNode> debtors = new PriorityQueue<>(
                (a, b) -> b.amount().compareTo(a.amount())
        );

        PriorityQueue<BalanceNode> creditors = new PriorityQueue<>(
                (a, b) -> b.amount().compareTo(a.amount())
        );

        BigDecimal threshold = new BigDecimal("0.01");

        for (Map.Entry<String, BigDecimal> entry : netBalances.entrySet()) {
            BigDecimal bal = entry.getValue();
            if (bal.compareTo(threshold.negate()) < 0) {
                // Owes money (store absolute amount)
                debtors.offer(new BalanceNode(entry.getKey(), bal.abs()));
            } else if (bal.compareTo(threshold) > 0) {
                // Is owed money
                creditors.offer(new BalanceNode(entry.getKey(), bal));
            }
        }

        // 3. Match greedily
        List<SimplifiedDebtItem> simplified = new ArrayList<>();
        BigDecimal totalSettled = BigDecimal.ZERO;

        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            BalanceNode debtor = debtors.poll();
            BalanceNode creditor = creditors.poll();

            BigDecimal settlement = debtor.amount().min(creditor.amount());
            settlement = settlement.setScale(2, RoundingMode.HALF_UP);

            simplified.add(SimplifiedDebtItem.builder()
                    .fromUser(debtor.person())
                    .toUser(creditor.person())
                    .amount(settlement)
                    .build());

            totalSettled = totalSettled.add(settlement);

            BigDecimal debtorRemainder = debtor.amount().subtract(settlement);
            BigDecimal creditorRemainder = creditor.amount().subtract(settlement);

            if (debtorRemainder.compareTo(threshold) > 0) {
                debtors.offer(new BalanceNode(debtor.person(), debtorRemainder));
            }
            if (creditorRemainder.compareTo(threshold) > 0) {
                creditors.offer(new BalanceNode(creditor.person(), creditorRemainder));
            }
        }

        return DebtSimplificationResponse.builder()
                .simplifiedPayments(simplified)
                .originalTransactionCount(debts.size())
                .simplifiedTransactionCount(simplified.size())
                .totalDebtSettled(totalSettled)
                .build();
    }
}
