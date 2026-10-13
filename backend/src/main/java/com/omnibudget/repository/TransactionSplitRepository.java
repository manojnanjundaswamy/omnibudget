package com.omnibudget.repository;

import com.omnibudget.domain.TransactionSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionSplitRepository extends JpaRepository<TransactionSplit, UUID> {
    List<TransactionSplit> findByTransactionId(UUID transactionId);
    List<TransactionSplit> findByBeneficiaryNameAndIsSettledFalse(String beneficiaryName);
}
