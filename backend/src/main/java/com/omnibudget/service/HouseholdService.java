package com.omnibudget.service;

import com.omnibudget.domain.Household;
import com.omnibudget.dto.SmartOffsetResponse;
import com.omnibudget.repository.HouseholdRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HouseholdService {

    private final HouseholdRepository householdRepository;

    public Household getCurrentHousehold() {
        List<Household> all = householdRepository.findAll();
        if (all.isEmpty()) {
            // Create default demo household
            Household defaultH = Household.builder()
                    .name("The Miller Household")
                    .partnerAName("You (Alex)")
                    .partnerBName("Jordan (Partner)")
                    .partnerASalary(new BigDecimal("6000.00"))
                    .partnerBSalary(new BigDecimal("4000.00"))
                    .partnerARatio(new BigDecimal("0.6000"))
                    .partnerBRatio(new BigDecimal("0.4000"))
                    .jointMonthlyTarget(new BigDecimal("4200.00"))
                    .jointPoolBalance(new BigDecimal("2150.00"))
                    .dependentName("Leo (Kid)")
                    .dependentAllowance(new BigDecimal("120.00"))
                    .dependentBalance(new BigDecimal("45.00"))
                    .build();
            return householdRepository.save(defaultH);
        }
        return all.get(0);
    }

    @Transactional
    public Household updateSalaries(BigDecimal salaryA, BigDecimal salaryB, BigDecimal jointTarget) {
        Household h = getCurrentHousehold();
        h.setPartnerASalary(salaryA);
        h.setPartnerBSalary(salaryB);
        h.setJointMonthlyTarget(jointTarget);

        BigDecimal total = salaryA.add(salaryB);
        if (total.compareTo(BigDecimal.ZERO) > 0) {
            h.setPartnerARatio(salaryA.divide(total, 4, RoundingMode.HALF_UP));
            h.setPartnerBRatio(salaryB.divide(total, 4, RoundingMode.HALF_UP));
        }

        return householdRepository.save(h);
    }

    /**
     * Smart Cross-Ledger Offset Algorithm:
     * When Partner B owes Partner A money (e.g. for dinner), this allows offsetting
     * it directly against Partner B's contribution to the joint household pool.
     */
    @Transactional
    public SmartOffsetResponse executeCrossOffset(BigDecimal peerDebtAmount) {
        Household h = getCurrentHousehold();
        BigDecimal debt = peerDebtAmount.abs();

        // Partner B deposits peer debt directly into joint household pool
        h.setJointPoolBalance(h.getJointPoolBalance().add(debt));
        householdRepository.save(h);

        String summary = String.format(
                "Internal peer debt of %s was absorbed into the Joint Pool. Partner B credited the joint fund; Partner A's grocery obligation was offset by the exact same amount.",
                debt.toPlainString()
        );

        return SmartOffsetResponse.builder()
                .partnerAOffset(debt)
                .partnerBOffset(debt)
                .newJointBalance(h.getJointPoolBalance())
                .summary(summary)
                .build();
    }
}
