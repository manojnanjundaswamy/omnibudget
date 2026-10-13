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
public class AdminMetricsDto {
    private int totalUsers;
    private int activeUsersToday;
    private BigDecimal mrr;
    private BigDecimal arr;
    private int payingSubscribers;
    private int starterUsers;
    private int proUsers;
    private int householdUsers;
    private int totalAccountsTracked;
    private int totalTransactionsProcessed;
    private BigDecimal totalAssetsUnderManagement;
    private String platformHealth;
    private String databaseEngine;
}
