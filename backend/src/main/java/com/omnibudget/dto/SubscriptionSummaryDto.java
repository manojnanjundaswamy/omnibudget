package com.omnibudget.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionSummaryDto {
    private String planId; // STARTER, PRO, HOUSEHOLD
    private String planName;
    private String billingCycle; // MONTHLY, ANNUAL
    private String status; // ACTIVE, PAST_DUE, CANCELED
    private BigDecimal currentPrice;
    private Instant renewsAt;

    // Quotas and usage
    private int accountsUsed;
    private int accountsLimit;
    private int budgetsUsed;
    private int budgetsLimit;
    private int goalsUsed;
    private int goalsLimit;
    private int rulesUsed;

    // Capabilities
    private boolean rulesEnabled;
    private boolean householdEnabled;
    private boolean splitSettlementEnabled;
}
