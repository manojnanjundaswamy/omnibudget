package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Builder.Default
    private String userId = "demo-user-id";

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false)
    @Builder.Default
    private String cadence = "MONTHLY"; // MONTHLY, ANNUAL

    private String category;
    private LocalDate nextBillingDate;

    private UUID accountId;
    private String accountName;

    @Builder.Default
    private Boolean isActive = true;
}
