package com.omnibudget.repository;

import com.omnibudget.domain.BudgetEnvelope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BudgetEnvelopeRepository extends JpaRepository<BudgetEnvelope, UUID> {
    List<BudgetEnvelope> findAllByOrderByGroupTypeAscCreatedAtAsc();
}
