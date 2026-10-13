package com.omnibudget.dto;

import com.omnibudget.domain.Asset;
import com.omnibudget.domain.AssetType;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetPortfolioSummaryDto {
    private BigDecimal totalInvested;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalGainLoss;
    private BigDecimal totalGainLossPercent;
    private BigDecimal totalMonthlySip;
    private int assetCount;
    private String currency;
    private Map<String, BigDecimal> allocationByType;
    private List<Asset> assets;
}
