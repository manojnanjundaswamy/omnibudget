package com.omnibudget.dto;

import lombok.Data;

@Data
public class UpgradePlanRequest {
    private String plan; // STARTER, PRO, HOUSEHOLD
    private String billingCycle; // MONTHLY, ANNUAL
}
