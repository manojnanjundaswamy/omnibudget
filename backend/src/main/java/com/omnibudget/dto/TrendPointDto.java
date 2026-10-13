package com.omnibudget.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendPointDto {
    private String month;
    private String monthKey;
    private BigDecimal income;
    private BigDecimal expenses;
    private BigDecimal netSavings;
    private BigDecimal netWorth;
    private Double savingsRate;
}
