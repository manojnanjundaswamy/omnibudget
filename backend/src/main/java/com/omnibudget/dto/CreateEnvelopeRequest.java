package com.omnibudget.dto;

import com.omnibudget.domain.EnvelopeGroup;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEnvelopeRequest {
    private String userId;
    private String name;
    private EnvelopeGroup groupType;
    private BigDecimal targetRatio;
    private BigDecimal monthlyBudget;
    private String icon;
    private String color;
}
