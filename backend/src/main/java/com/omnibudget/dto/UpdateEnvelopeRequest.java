package com.omnibudget.dto;

import com.omnibudget.domain.EnvelopeGroup;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateEnvelopeRequest {
    private String name;
    private EnvelopeGroup groupType;
    private BigDecimal monthlyBudget;
    private String color;
    private String icon;
}
