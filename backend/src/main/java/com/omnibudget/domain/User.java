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
    private Boolean hasCompletedOnboarding = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.currency == null) this.currency = "USD";
        if (this.hasCompletedOnboarding == null) this.hasCompletedOnboarding = false;
        if (this.provider == null) this.provider = "EMAIL";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
