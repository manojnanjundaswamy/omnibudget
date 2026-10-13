package com.omnibudget.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class SmartClipRequest {
    private String text;
    private UUID accountId;
}
