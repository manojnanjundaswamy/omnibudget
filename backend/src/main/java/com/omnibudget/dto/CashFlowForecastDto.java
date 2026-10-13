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
public class CashFlowForecastDto {
    private BigDecimal startingBalance;
    private BigDecimal endingBalance;
    private BigDecimal lowestProjectedBalance;
    private String lowestBalanceDate;
    private boolean riskOfNegativeBalance;
    private BigDecimal totalExpectedInflow;
    private BigDecimal totalExpectedOutflow;
    private List<ForecastDay> days;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastDay {
        private String date; // YYYY-MM-DD
        private int dayOfWeek; // 1-7
        private BigDecimal balance;
        private BigDecimal inflow;
        private BigDecimal outflow;
        private String eventDescription;
        private String status; // SAFE, WARNING, DANGER
    }
}
