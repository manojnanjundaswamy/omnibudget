package com.omnibudget.service;

import com.omnibudget.domain.Transaction;
import com.omnibudget.domain.TransactionRule;
import com.omnibudget.domain.TransactionType;
import com.omnibudget.dto.CreateRuleRequest;
import com.omnibudget.repository.TransactionRepository;
import com.omnibudget.repository.TransactionRuleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RuleServiceTest {

    @Mock
    private TransactionRuleRepository ruleRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private RuleService ruleService;

    @Test
    @DisplayName("Should create transaction rule with defaults")
    void testCreateRule() {
        CreateRuleRequest req = CreateRuleRequest.builder()
                .userId("test-user")
                .name("Auto Coffee")
                .matchField("DESCRIPTION")
                .matchType("CONTAINS")
                .matchValue("Starbucks")
                .applyCategory("Coffee & Dining")
                .applyMerchant("Starbucks Corp")
                .build();

        when(ruleRepository.save(any(TransactionRule.class))).thenAnswer(i -> i.getArgument(0));

        TransactionRule rule = ruleService.createRule(req);

        assertNotNull(rule);
        assertEquals("Auto Coffee", rule.getName());
        assertEquals("CONTAINS", rule.getMatchType());
        assertEquals("Starbucks", rule.getMatchValue());
        assertEquals("Coffee & Dining", rule.getApplyCategory());
    }

    @Test
    @DisplayName("Should match transaction by CONTAINS rule and assign category and merchant")
    void testApplyRulesToTransactionContains() {
        TransactionRule rule = TransactionRule.builder()
                .userId("test-user")
                .name("Uber Transit")
                .matchField("DESCRIPTION")
                .matchType("CONTAINS")
                .matchValue("Uber Trip")
                .applyCategory("Transportation")
                .applyMerchant("Uber Inc")
                .isActive(true)
                .build();

        when(ruleRepository.findByUserIdAndIsActiveTrue("test-user")).thenReturn(List.of(rule));

        Transaction tx = Transaction.builder()
                .description("Card charge at Uber Trip #9123")
                .category("Uncategorized")
                .amount(new BigDecimal("-24.50"))
                .type(TransactionType.EXPENSE)
                .date(LocalDate.now())
                .build();

        boolean matched = ruleService.applyRulesToTransaction(tx, "test-user");

        assertTrue(matched);
        assertEquals("Transportation", tx.getCategory());
        assertEquals("Uber Inc", tx.getMerchant());
    }

    @Test
    @DisplayName("Should match transaction by STARTS_WITH rule")
    void testApplyRulesToTransactionStartsWith() {
        TransactionRule rule = TransactionRule.builder()
                .userId("test-user")
                .name("WHOLEFDS")
                .matchField("DESCRIPTION")
                .matchType("STARTS_WITH")
                .matchValue("WHOLEFDS")
                .applyCategory("Groceries")
                .applyMerchant("Whole Foods Market")
                .isActive(true)
                .build();

        when(ruleRepository.findByUserIdAndIsActiveTrue("test-user")).thenReturn(List.of(rule));

        Transaction tx = Transaction.builder()
                .description("WHOLEFDS STORE #102")
                .category("General")
                .amount(new BigDecimal("-85.20"))
                .type(TransactionType.EXPENSE)
                .date(LocalDate.now())
                .build();

        boolean matched = ruleService.applyRulesToTransaction(tx, "test-user");

        assertTrue(matched);
        assertEquals("Groceries", tx.getCategory());
        assertEquals("Whole Foods Market", tx.getMerchant());
    }
}
