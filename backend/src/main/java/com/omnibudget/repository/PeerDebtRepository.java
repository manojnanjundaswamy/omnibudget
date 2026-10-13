package com.omnibudget.repository;

import com.omnibudget.domain.PeerDebt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PeerDebtRepository extends JpaRepository<PeerDebt, UUID> {
    List<PeerDebt> findBySplitGroupId(UUID splitGroupId);
    Optional<PeerDebt> findByFromUserAndToUser(String fromUser, String toUser);
    List<PeerDebt> findByFromUserOrToUser(String user1, String user2);
}
