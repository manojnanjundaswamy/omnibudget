package com.omnibudget.repository;

import com.omnibudget.domain.CapturedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CapturedItemRepository extends JpaRepository<CapturedItem, UUID> {
    List<CapturedItem> findByUserIdOrderByReceivedAtDesc(String userId);

    @Query("SELECT c FROM CapturedItem c WHERE c.userId = :userId AND (c.status IN ('PENDING', 'UNREADABLE') OR c.decidedAt > :since) ORDER BY CASE WHEN c.status = 'PENDING' THEN 0 ELSE 1 END, c.receivedAt DESC")
    List<CapturedItem> findActiveOrRecentByUserId(String userId, Instant since);

    long countByUserIdAndStatus(String userId, String status);

    long countByUserIdAndReceivedAtAfter(String userId, Instant after);

    Optional<CapturedItem> findByIdAndUserId(UUID id, String userId);
}
