package com.omnibudget.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {
    private BigDecimal netWorth;
    private BigDecimal totalLiquidAssets;
    private BigDecimal totalCreditLiabilities;
    private BigDecimal totalInvestments;
    private BigDecimal safeToSpend;
    private BigDecimal totalIncomeThisMonth;
    private BigDecimal totalExpensesThisMonth;
    private BigDecimal totalReceivablesIOU;
    private BigDecimal totalPayablesIOU;
    private String currency;
    private int accountCount;
    private int envelopeCount;
}
