package com.omnibudget.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_logs_created_at", columnList = "created_at DESC"),
        @Index(name = "idx_audit_logs_user_email", columnList = "user_email"),
        @Index(name = "idx_audit_logs_category", columnList = "category")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_email", length = 180)
    private String userEmail;

    @Column(name = "user_name", length = 120)
    private String userName;

    @Column(nullable = false, length = 80)
    private String action; // USER_LOGIN, EXPENSE_CREATED, SETTLEMENT_EXECUTED, etc.

    @Column(nullable = false, length = 50)
    private String category; // AUTH, TRANSACTION, LEDGER, SECURITY, ADMIN

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "ip_address", length = 60)
    private String ipAddress;

    @Column(length = 30)
    @Builder.Default
    private String severity = "INFO"; // INFO, WARNING, CRITICAL, SECURITY

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
