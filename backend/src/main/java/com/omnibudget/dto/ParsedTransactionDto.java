package com.omnibudget.dto;

import com.omnibudget.domain.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedTransactionDto {
    private LocalDate date;
    private String merchant;
    private String description;
    private BigDecimal amount;
    private TransactionType type;
    private String suggestedCategory;
    private String ruleMatched;
    private Double confidence;
}
