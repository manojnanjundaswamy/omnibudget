package com.omnibudget.repository;

import com.omnibudget.domain.CaptureAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaptureAddressRepository extends JpaRepository<CaptureAddress, UUID> {
    Optional<CaptureAddress> findByUserId(String userId);
    Optional<CaptureAddress> findByToken(String token);
    Optional<CaptureAddress> findByInboundEmail(String inboundEmail);
}
