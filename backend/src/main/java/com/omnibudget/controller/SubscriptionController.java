package com.omnibudget.controller;

import com.omnibudget.domain.Subscription;
import com.omnibudget.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionRepository subscriptionRepository;

    @GetMapping
    public ResponseEntity<List<Subscription>> getAllSubscriptions(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null || userId.isBlank() || "demo-user-id".equals(userId)) {
            List<Subscription> userSubs = subscriptionRepository.findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc("demo-user-id");
            return ResponseEntity.ok(userSubs.isEmpty() ? subscriptionRepository.findByIsActiveTrueOrderByNextBillingDateAsc() : userSubs);
        }
        return ResponseEntity.ok(subscriptionRepository.findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc(userId));
    }

    @PostMapping
    public ResponseEntity<Subscription> createSubscription(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Subscription subscription) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        subscription.setUserId(effectiveUserId);
        return ResponseEntity.ok(subscriptionRepository.save(subscription));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Subscription> updateSubscription(
            @PathVariable java.util.UUID id,
            @RequestBody Subscription req) {
        Subscription sub = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found: " + id));
        if (req.getName() != null) sub.setName(req.getName());
        if (req.getAmount() != null) sub.setAmount(req.getAmount());
        if (req.getCadence() != null) sub.setCadence(req.getCadence());
        if (req.getCategory() != null) sub.setCategory(req.getCategory());
        if (req.getNextBillingDate() != null) sub.setNextBillingDate(req.getNextBillingDate());
        if (req.getAccountId() != null) sub.setAccountId(req.getAccountId());
        if (req.getAccountName() != null) sub.setAccountName(req.getAccountName());
        if (req.getIsActive() != null) sub.setIsActive(req.getIsActive());
        return ResponseEntity.ok(subscriptionRepository.save(sub));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, String>> deleteSubscription(@PathVariable java.util.UUID id) {
        subscriptionRepository.deleteById(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Subscription removed successfully"));
    }
}
