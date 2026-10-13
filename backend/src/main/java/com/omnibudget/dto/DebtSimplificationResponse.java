package com.omnibudget.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebtSimplificationResponse {
    private List<SimplifiedDebtItem> simplifiedPayments;
    private int originalTransactionCount;
    private int simplifiedTransactionCount;
    private BigDecimal totalDebtSettled;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimplifiedDebtItem {
        private String fromUser;
        private String toUser;
        private BigDecimal amount;
    }
}
