package com.omnibudget.repository;

import com.omnibudget.domain.TransactionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRuleRepository extends JpaRepository<TransactionRule, UUID> {
    List<TransactionRule> findByUserIdOrderByCreatedAtDesc(String userId);
    List<TransactionRule> findByUserIdAndIsActiveTrue(String userId);
}
