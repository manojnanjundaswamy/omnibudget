package com.omnibudget.dto;

import com.omnibudget.domain.TransactionType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateTransactionRequest {
    private UUID accountId;
    private BigDecimal amount;
    private TransactionType type;
    private String category;
    private UUID envelopeId;
    private String merchant;
    private String description;
    private LocalDate date;
}
