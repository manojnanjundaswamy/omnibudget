package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Builder.Default
    private String userId = "demo-user-id";

    @Column(nullable = false)
    private String name;

    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetType type;

    @Column(precision = 19, scale = 4)
    private BigDecimal quantity;

    @Column(precision = 19, scale = 4)
    private BigDecimal buyPrice;

    @Column(precision = 19, scale = 4)
    private BigDecimal currentPrice;

    @Column(precision = 19, scale = 4)
    private BigDecimal investedAmount;

    @Column(precision = 19, scale = 4)
    private BigDecimal currentValue;

    @Column(precision = 19, scale = 4)
    private BigDecimal unrealizedGainLoss;

    @Column(precision = 10, scale = 4)
    private BigDecimal unrealizedGainLossPercent;

    @Column(precision = 19, scale = 4)
    private BigDecimal sipMonthlyContribution;

    private Integer sipDayOfMonth;

    @Column(length = 10)
    @Builder.Default
    private String currency = "USD";

    private String notes;

    private UUID accountId;

    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        recalculateValuation();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
        recalculateValuation();
    }

    public void recalculateValuation() {
        if (this.currency == null || this.currency.isBlank()) {
            this.currency = "USD";
        }
        if (this.isActive == null) {
            this.isActive = true;
        }

        // For quantity and price based calculation
        if (this.quantity != null && this.buyPrice != null && this.investedAmount == null) {
            this.investedAmount = this.quantity.multiply(this.buyPrice);
        } else if (this.investedAmount == null) {
            this.investedAmount = BigDecimal.ZERO;
        }

        if (this.quantity != null && this.currentPrice != null) {
            this.currentValue = this.quantity.multiply(this.currentPrice);
        } else if (this.currentValue == null) {
            this.currentValue = this.investedAmount;
        }

        if (this.currentValue != null && this.investedAmount != null) {
            this.unrealizedGainLoss = this.currentValue.subtract(this.investedAmount);
            if (this.investedAmount.compareTo(BigDecimal.ZERO) > 0) {
                this.unrealizedGainLossPercent = this.unrealizedGainLoss
                        .divide(this.investedAmount, 6, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            } else {
                this.unrealizedGainLossPercent = BigDecimal.ZERO;
            }
        }
    }
}
