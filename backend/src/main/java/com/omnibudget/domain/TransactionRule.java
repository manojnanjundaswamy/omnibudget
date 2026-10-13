package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transaction_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Builder.Default
    private String userId = "demo-user-id";

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private String matchField = "DESCRIPTION"; // DESCRIPTION, MERCHANT

    @Column(nullable = false)
    @Builder.Default
    private String matchType = "CONTAINS"; // CONTAINS, EQUALS, STARTS_WITH

    @Column(nullable = false)
    private String matchValue;

    @Column(nullable = false)
    private String applyCategory;

    private String applyMerchant;

    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.userId == null) this.userId = "demo-user-id";
        if (this.matchField == null) this.matchField = "DESCRIPTION";
        if (this.matchType == null) this.matchType = "CONTAINS";
        if (this.isActive == null) this.isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
