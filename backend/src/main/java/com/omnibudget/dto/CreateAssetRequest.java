package com.omnibudget.dto;

import com.omnibudget.domain.AssetType;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAssetRequest {
    private String userId;
    private String name;
    private String symbol;
    private AssetType type;
    private BigDecimal quantity;
    private BigDecimal buyPrice;
    private BigDecimal currentPrice;
    private BigDecimal investedAmount;
    private BigDecimal currentValue;
    private BigDecimal sipMonthlyContribution;
    private Integer sipDayOfMonth;
    private String currency;
    private String notes;
    private UUID accountId;
}
