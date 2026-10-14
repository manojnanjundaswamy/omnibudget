package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "captured_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CapturedItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String source; // EMAIL, PASTE, SHARE

    @Column(nullable = false)
    private String status; // PENDING, ADDED, DISMISSED, UNREADABLE

    private String sender;
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    private TransactionType kind; // EXPENSE, INCOME

    @Column(precision = 19, scale = 4)
    private BigDecimal amount;

    private LocalDate occurredOn;
    private String merchant;
    private String bank;
    private String accountHint;

    @Column(precision = 19, scale = 4)
    private BigDecimal balance;

    private UUID accountId;
    private String accountName;
    private String category;
    private String categorySource; // RULE, HISTORY, HEURISTIC

    private UUID duplicateOf;
    private UUID transactionId;

    @Column(nullable = false)
    private Instant receivedAt;

    private Instant decidedAt;

    @PrePersist
    protected void onCreate() {
        if (this.receivedAt == null) {
            this.receivedAt = Instant.now();
        }
    }
}
