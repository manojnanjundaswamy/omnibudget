package com.omnibudget.dto;

import com.omnibudget.domain.TransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTransactionRequest {
    private String userId;
    private UUID accountId;
    private BigDecimal amount;
    private TransactionType type;
    private String category;
    private UUID envelopeId;
    private String merchant;
    private String description;
    private LocalDate date;
    private Boolean isRecurring;

    // Split details
    private UUID splitGroupId;
    private List<String> splitMembers; // For quick equal split (e.g. ["You", "Alice", "Bob"])
    private List<SplitItemDto> customSplits; // For unequal splits

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SplitItemDto {
        private String beneficiaryName;
        private BigDecimal shareAmount;
        private Boolean isPayer;
    }
}
