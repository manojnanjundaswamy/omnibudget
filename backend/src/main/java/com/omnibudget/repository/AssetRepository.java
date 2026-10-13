package com.omnibudget.repository;

import com.omnibudget.domain.Asset;
import com.omnibudget.domain.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {
    List<Asset> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(String userId);
    List<Asset> findByIsActiveTrueOrderByCreatedAtDesc();
    List<Asset> findByUserIdAndTypeAndIsActiveTrue(String userId, AssetType type);
    long countByUserIdAndIsActiveTrue(String userId);
}
