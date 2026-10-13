package com.omnibudget.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementRequest {
    private String fromUser;
    private String toUser;
    private BigDecimal amount;
    private UUID splitGroupId;
    private UUID targetAccountId; // Account into which the funds are deposited
}
