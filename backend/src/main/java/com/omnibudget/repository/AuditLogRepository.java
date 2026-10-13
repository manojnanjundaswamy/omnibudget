package com.omnibudget.repository;

import com.omnibudget.domain.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<AuditLog> findByCategoryOrderByCreatedAtDesc(String category, Pageable pageable);

    long countByCategory(String category);
}
