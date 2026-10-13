package com.omnibudget.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {
    private UUID id;
    private String email;
    private String name;
    private String role;
    private String plan;
    private String billingCycle;
    private String status;
    private String currency;
    private int accountsCount;
    private int transactionsCount;
    private BigDecimal totalBalance;
    private Instant createdAt;
    private Instant lastLoginAt;
}
