package com.omnibudget.dto;

import lombok.Data;

@Data
public class UpdateRuleRequest {
    private String name;
    private String matchField;
    private String matchType;
    private String matchValue;
    private String applyCategory;
    private String applyMerchant;
    private Boolean isActive;
}
