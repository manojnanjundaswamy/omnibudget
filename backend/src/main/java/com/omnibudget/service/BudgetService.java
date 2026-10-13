package com.omnibudget.service;

import com.omnibudget.domain.BudgetEnvelope;
import com.omnibudget.domain.EnvelopeGroup;
import com.omnibudget.dto.CreateEnvelopeRequest;
import com.omnibudget.repository.BudgetEnvelopeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetEnvelopeRepository envelopeRepository;

    public List<BudgetEnvelope> getAllEnvelopes() {
        return envelopeRepository.findAllByOrderByGroupTypeAscCreatedAtAsc();
    }

    public BudgetEnvelope getEnvelopeById(UUID id) {
        return envelopeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Envelope not found with id: " + id));
    }

    @Transactional
    public BudgetEnvelope createEnvelope(CreateEnvelopeRequest req) {
        BudgetEnvelope envelope = BudgetEnvelope.builder()
                .name(req.getName())
                .groupType(req.getGroupType())
                .targetRatio(req.getTargetRatio() != null ? req.getTargetRatio() : BigDecimal.ZERO)
                .monthlyBudget(req.getMonthlyBudget() != null ? req.getMonthlyBudget() : BigDecimal.ZERO)
                .spentAmount(BigDecimal.ZERO)
                .rolloverSurplus(BigDecimal.ZERO)
                .icon(req.getIcon() != null ? req.getIcon() : "tag")
                .color(req.getColor() != null ? req.getColor() : "#6366f1")
                .build();
        return envelopeRepository.save(envelope);
    }

    @Transactional
    public BudgetEnvelope updateBudget(UUID id, BigDecimal newMonthlyBudget) {
        BudgetEnvelope envelope = getEnvelopeById(id);
        envelope.setMonthlyBudget(newMonthlyBudget);
        return envelopeRepository.save(envelope);
    }

    /**
     * Rebalance: Move available funds from surplus envelope to cover an overspent envelope
     */
    @Transactional
    public void rebalanceEnvelopes(UUID sourceEnvelopeId, UUID targetEnvelopeId, BigDecimal amount) {
        BudgetEnvelope source = getEnvelopeById(sourceEnvelopeId);
        BudgetEnvelope target = getEnvelopeById(targetEnvelopeId);

        // Deduct from source budget, add to target budget
        source.setMonthlyBudget(source.getMonthlyBudget().subtract(amount));
        target.setMonthlyBudget(target.getMonthlyBudget().add(amount));

        envelopeRepository.save(source);
        envelopeRepository.save(target);
    }

    /**
     * Auto-allocate total monthly income using the 50/30/20 guideline or configured target ratios
     */
    @Transactional
    public void autoAllocateIncome(BigDecimal totalIncome) {
        List<BudgetEnvelope> envelopes = envelopeRepository.findAll();
        if (envelopes.isEmpty() || totalIncome.compareTo(BigDecimal.ZERO) <= 0) return;

        for (BudgetEnvelope env : envelopes) {
            BigDecimal allocated = totalIncome.multiply(env.getTargetRatio()).setScale(2, RoundingMode.HALF_UP);
            env.setMonthlyBudget(allocated);
        }
        envelopeRepository.saveAll(envelopes);
    }
}
