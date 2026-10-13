package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transaction_splits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID transactionId;

    @Column(nullable = false)
    private String beneficiaryName;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal shareAmount;

    @Builder.Default
    private Boolean isPersonalLiability = false; // true if this is payer's own consumption

    @Builder.Default
    private Boolean isReceivableAsset = false; // true if fronted for someone else

    @Builder.Default
    private Boolean isSettled = false;

    private Instant settledAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.shareAmount == null) this.shareAmount = BigDecimal.ZERO;
    }
}
