package com.omnibudget.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmartOffsetResponse {
    private BigDecimal partnerAOffset;
    private BigDecimal partnerBOffset;
    private BigDecimal newJointBalance;
    private String summary;
}
