package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "budget_envelopes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetEnvelope {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnvelopeGroup groupType;

    @Column(nullable = false, precision = 7, scale = 4)
    private BigDecimal targetRatio; // e.g. 0.5000 for 50%

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal monthlyBudget;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal spentAmount;

    @Column(precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal rolloverSurplus = BigDecimal.ZERO;

    @Builder.Default
    private Boolean rolloverEnabled = true;

    private String icon;
    private String color;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.monthlyBudget == null) this.monthlyBudget = BigDecimal.ZERO;
        if (this.spentAmount == null) this.spentAmount = BigDecimal.ZERO;
        if (this.rolloverSurplus == null) this.rolloverSurplus = BigDecimal.ZERO;
        if (this.targetRatio == null) this.targetRatio = BigDecimal.ZERO;
    }
}
