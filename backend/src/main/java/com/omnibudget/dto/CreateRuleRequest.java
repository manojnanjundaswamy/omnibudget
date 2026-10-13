package com.omnibudget.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRuleRequest {
    private String userId;
    private String name;
    private String matchField;
    private String matchType;
    private String matchValue;
    private String applyCategory;
    private String applyMerchant;
    private Boolean isActive;
}
