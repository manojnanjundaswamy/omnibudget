package com.omnibudget.repository;

import com.omnibudget.domain.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    List<Subscription> findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc(String userId);
    List<Subscription> findByIsActiveTrueOrderByNextBillingDateAsc();
}
