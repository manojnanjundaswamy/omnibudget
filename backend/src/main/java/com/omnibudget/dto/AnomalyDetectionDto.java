package com.omnibudget.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyDetectionDto {
    private int totalAnomalies;
    private BigDecimal potentialSavings;
    private List<AnomalyItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnomalyItem {
        private String id;
        private String type; // PRICE_HIKE, DUPLICATE_CHARGE, LARGE_OUTLIER, HIGH_FREQUENCY
        private String title;
        private String description;
        private BigDecimal amount;
        private String date;
        private String merchant;
        private String severity; // HIGH, MEDIUM, LOW
        private String suggestedAction;
    }
}
