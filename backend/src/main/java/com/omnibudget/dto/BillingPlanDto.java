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
public class BillingPlanDto {
    private String id; // STARTER, PRO, HOUSEHOLD
    private String name;
    private String tagline;
    private BigDecimal monthlyPrice;
    private BigDecimal annualPrice;
    private int maxAccounts;
    private int maxBudgets;
    private int maxGoals;
    private boolean rulesEngineEnabled;
    private boolean recurringCalendarEnabled;
    private boolean householdCollaborationEnabled;
    private boolean splitSettlementEnabled;
    private List<String> features;
    private boolean isPopular;
}
