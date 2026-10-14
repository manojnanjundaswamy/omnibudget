package com.omnibudget.dto;

import com.omnibudget.domain.TransactionType;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddCapturedItemRequest {
    private TransactionType kind;
    private BigDecimal amount;
    private UUID accountId;
    private String category;
    private UUID envelopeId;
    private LocalDate occurredOn;
    private String merchant;
    private String description;
}
