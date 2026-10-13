package com.omnibudget.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferRequest {
    private UUID sourceAccountId;
    private UUID targetAccountId;
    private BigDecimal amount;
    private String description;
    private LocalDate date;
}
