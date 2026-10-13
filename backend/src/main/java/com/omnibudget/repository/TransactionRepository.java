package com.omnibudget.repository;

import com.omnibudget.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findAllByOrderByDateDescCreatedAtDesc();
    List<Transaction> findByUserIdOrderByDateDescCreatedAtDesc(String userId);
    List<Transaction> findByAccountIdOrderByDateDescCreatedAtDesc(UUID accountId);
    List<Transaction> findByUserIdAndAccountIdOrderByDateDescCreatedAtDesc(String userId, UUID accountId);
    List<Transaction> findByEnvelopeIdOrderByDateDescCreatedAtDesc(UUID envelopeId);
    List<Transaction> findByUserIdAndEnvelopeIdOrderByDateDescCreatedAtDesc(String userId, UUID envelopeId);
    List<Transaction> findByUserIdAndCategoryIgnoreCaseOrderByDateDescCreatedAtDesc(String userId, String category);
    List<Transaction> findBySplitGroupIdOrderByDateDescCreatedAtDesc(UUID splitGroupId);
    List<Transaction> findByUserIdAndSplitGroupIdOrderByDateDescCreatedAtDesc(String userId, UUID splitGroupId);
    List<Transaction> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);

    @Query("SELECT t FROM Transaction t WHERE t.receivableAmount > 0 ORDER BY t.date DESC")
    List<Transaction> findActiveReceivables();

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.receivableAmount > 0 ORDER BY t.date DESC")
    List<Transaction> findActiveReceivablesByUserId(String userId);
}
