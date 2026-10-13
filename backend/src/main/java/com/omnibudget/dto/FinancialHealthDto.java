package com.omnibudget.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialHealthDto {
    private int score; // 0 to 100
    private String grade; // A+, A, B, C, Needs Attention
    private String statusText;
    private BigDecimal emergencyRunwayMonths;
    private BigDecimal savingsRatePercent;
    private BigDecimal debtToAssetRatio;
    private BigDecimal budgetAdherencePercent;
    private BigDecimal recurringBurdenPercent;
    private List<HealthPillar> pillars;
    private List<String> recommendations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthPillar {
        private String name;
        private int score;
        private int maxScore;
        private String status; // EXCELLENT, HEALTHY, WARNING, CRITICAL
        private String metric;
        private String advice;
    }
}
