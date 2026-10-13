package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    private String password;

    @Builder.Default
    private String provider = "EMAIL"; // GOOGLE, EMAIL, DEMO

    private String avatarUrl;

    @Builder.Default
    private String currency = "USD"; // USD, EUR, INR, GBP, etc.

    @Builder.Default
    private String plan = "PRO"; // STARTER, PRO, HOUSEHOLD

    @Builder.Default
    private String billingCycle = "MONTHLY"; // MONTHLY, ANNUAL

    @Builder.Default
    private String subscriptionStatus = "ACTIVE"; // ACTIVE, PAST_DUE, CANCELED

    @Builder.Default
    private String role = "USER"; // USER, ADMIN

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, SUSPENDED

    private Instant lastLoginAt;

    @Builder.Default
    private Boolean hasCompletedOnboarding = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.lastLoginAt = Instant.now();
        if (this.currency == null) this.currency = "USD";
        if (this.plan == null) this.plan = "PRO";
        if (this.billingCycle == null) this.billingCycle = "MONTHLY";
        if (this.subscriptionStatus == null) this.subscriptionStatus = "ACTIVE";
        if (this.role == null) this.role = "USER";
        if (this.status == null) this.status = "ACTIVE";
        if (this.hasCompletedOnboarding == null) this.hasCompletedOnboarding = false;
        if (this.provider == null) this.provider = "EMAIL";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
