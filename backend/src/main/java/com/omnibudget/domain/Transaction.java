package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID accountId;

    private String accountName;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount; // Negative for debit/expense, positive for income/credit

    @Column(precision = 19, scale = 4)
    private BigDecimal grossAmount; // Absolute total

    @Column(precision = 19, scale = 4)
    private BigDecimal netPersonalAmount; // User's true personal share (Split-to-budget invariant)

    @Column(precision = 19, scale = 4)
    private BigDecimal receivableAmount; // Amount owed by friends/group

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    private String category;

    private UUID envelopeId;
    private String envelopeName;

    private String merchant;
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.CLEARED;

    @Builder.Default
    private Boolean isRecurring = false;

    private UUID splitGroupId;
    private String splitGroupName;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.grossAmount == null && this.amount != null) {
            this.grossAmount = this.amount.abs();
        }
        if (this.netPersonalAmount == null) {
            this.netPersonalAmount = this.amount;
        }
        if (this.receivableAmount == null) {
            this.receivableAmount = BigDecimal.ZERO;
        }
        if (this.date == null) {
            this.date = LocalDate.now();
        }
    }
}
