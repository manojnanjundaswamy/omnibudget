package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "households")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Household {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String partnerAName;

    @Column(nullable = false)
    private String partnerBName;

    @Column(precision = 19, scale = 4)
    private BigDecimal partnerASalary;

    @Column(precision = 19, scale = 4)
    private BigDecimal partnerBSalary;

    @Column(precision = 7, scale = 4)
    private BigDecimal partnerARatio; // e.g. 0.6000

    @Column(precision = 7, scale = 4)
    private BigDecimal partnerBRatio; // e.g. 0.4000

    @Column(precision = 19, scale = 4)
    private BigDecimal jointMonthlyTarget;

    @Column(precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal jointPoolBalance = BigDecimal.ZERO;

    private String dependentName;

    @Column(precision = 19, scale = 4)
    private BigDecimal dependentAllowance;

    @Column(precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal dependentBalance = BigDecimal.ZERO;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.jointPoolBalance == null) this.jointPoolBalance = BigDecimal.ZERO;
        if (this.dependentBalance == null) this.dependentBalance = BigDecimal.ZERO;
    }
}
