package com.omnibudget.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class IngestCommitRequest {
    private UUID accountId;
    private List<ParsedTransactionDto> transactions;
}
