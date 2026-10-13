package com.omnibudget.service;

import com.omnibudget.domain.Transaction;
import com.omnibudget.domain.TransactionRule;
import com.omnibudget.dto.CreateRuleRequest;
import com.omnibudget.dto.UpdateRuleRequest;
import com.omnibudget.repository.TransactionRepository;
import com.omnibudget.repository.TransactionRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RuleService {

    private final TransactionRuleRepository ruleRepository;
    private final TransactionRepository transactionRepository;

    public List<TransactionRule> getRules(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        return ruleRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId);
    }

    @Transactional
    public TransactionRule createRule(CreateRuleRequest req) {
        String effectiveUserId = (req.getUserId() != null && !req.getUserId().isBlank()) ? req.getUserId() : "demo-user-id";
        TransactionRule rule = TransactionRule.builder()
                .userId(effectiveUserId)
                .name(req.getName())
                .matchField(req.getMatchField() != null ? req.getMatchField().toUpperCase() : "DESCRIPTION")
                .matchType(req.getMatchType() != null ? req.getMatchType().toUpperCase() : "CONTAINS")
                .matchValue(req.getMatchValue() != null ? req.getMatchValue().trim() : "")
                .applyCategory(req.getApplyCategory())
                .applyMerchant(req.getApplyMerchant())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();
        return ruleRepository.save(rule);
    }

    @Transactional
    public TransactionRule updateRule(UUID id, UpdateRuleRequest req) {
        TransactionRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found with id: " + id));

        if (req.getName() != null) rule.setName(req.getName());
        if (req.getMatchField() != null) rule.setMatchField(req.getMatchField().toUpperCase());
        if (req.getMatchType() != null) rule.setMatchType(req.getMatchType().toUpperCase());
        if (req.getMatchValue() != null) rule.setMatchValue(req.getMatchValue().trim());
        if (req.getApplyCategory() != null) rule.setApplyCategory(req.getApplyCategory());
        if (req.getApplyMerchant() != null) rule.setApplyMerchant(req.getApplyMerchant());
        if (req.getIsActive() != null) rule.setIsActive(req.getIsActive());

        return ruleRepository.save(rule);
    }

    @Transactional
    public void deleteRule(UUID id) {
        ruleRepository.deleteById(id);
    }

    public boolean applyRulesToTransaction(Transaction tx, String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        List<TransactionRule> activeRules = ruleRepository.findByUserIdAndIsActiveTrue(effectiveUserId);
        return evaluateAndApplyRules(tx, activeRules);
    }

    private boolean evaluateAndApplyRules(Transaction tx, List<TransactionRule> activeRules) {
        boolean modified = false;
        for (TransactionRule rule : activeRules) {
            String targetValue = "";
            if ("MERCHANT".equalsIgnoreCase(rule.getMatchField())) {
                targetValue = tx.getMerchant() != null ? tx.getMerchant() : "";
            } else {
                targetValue = tx.getDescription() != null ? tx.getDescription() : "";
            }

            boolean matches = false;
            String pattern = rule.getMatchValue() != null ? rule.getMatchValue().toLowerCase() : "";
            String subject = targetValue.toLowerCase();

            if ("EQUALS".equalsIgnoreCase(rule.getMatchType())) {
                matches = subject.equals(pattern);
            } else if ("STARTS_WITH".equalsIgnoreCase(rule.getMatchType())) {
                matches = subject.startsWith(pattern);
            } else { // Default: CONTAINS
                matches = subject.contains(pattern);
            }

            if (matches) {
                if (rule.getApplyCategory() != null && !rule.getApplyCategory().isBlank()) {
                    tx.setCategory(rule.getApplyCategory());
                    modified = true;
                }
                if (rule.getApplyMerchant() != null && !rule.getApplyMerchant().isBlank()) {
                    tx.setMerchant(rule.getApplyMerchant());
                    modified = true;
                }
                break; // Stop at first rule match
            }
        }
        return modified;
    }

    @Transactional
    public Map<String, Object> runRulesOnAllTransactions(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        List<TransactionRule> rules = ruleRepository.findByUserIdAndIsActiveTrue(effectiveUserId);
        List<Transaction> allTxs = transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc(effectiveUserId);

        int updatedCount = 0;
        for (Transaction tx : allTxs) {
            if (evaluateAndApplyRules(tx, rules)) {
                transactionRepository.save(tx);
                updatedCount++;
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("totalTransactions", allTxs.size());
        res.put("updatedCount", updatedCount);
        res.put("activeRulesCount", rules.size());
        return res;
    }
}
