package com.omnibudget.dto;

import com.omnibudget.domain.AccountType;
import com.omnibudget.domain.EnvelopeGroup;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OnboardingRequest {
    private String currency; // "USD", "EUR", "INR", "GBP"
    
    // Step 2: First Account
    private InitialAccountDto initialAccount;

    // Step 3: Starting Budget Envelopes
    private List<InitialEnvelopeDto> initialEnvelopes;

    @Data
    public static class InitialAccountDto {
        private String name;
        private String institutionName;
        private AccountType type;
        private BigDecimal balance;
    }

    @Data
    public static class InitialEnvelopeDto {
        private String name;
        private EnvelopeGroup groupType;
        private BigDecimal monthlyBudget;
        private String icon;
        private String color;
    }
}
