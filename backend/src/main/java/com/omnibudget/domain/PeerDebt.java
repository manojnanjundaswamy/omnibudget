package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "peer_debts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeerDebt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID splitGroupId;

    @Column(nullable = false)
    private String fromUser; // Debtor

    @Column(nullable = false)
    private String toUser; // Creditor

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    private Instant lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.lastUpdated = Instant.now();
        if (this.amount == null) this.amount = BigDecimal.ZERO;
    }
}
