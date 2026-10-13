package com.omnibudget.repository;

import com.omnibudget.domain.SplitGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SplitGroupRepository extends JpaRepository<SplitGroup, UUID> {
    java.util.List<SplitGroup> findByUserId(String userId);
}
