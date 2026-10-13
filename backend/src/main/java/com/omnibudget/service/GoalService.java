package com.omnibudget.service;

import com.omnibudget.domain.Goal;
import com.omnibudget.dto.CreateGoalRequest;
import com.omnibudget.dto.UpdateGoalRequest;
import com.omnibudget.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    public List<Goal> getGoals(String userId) {
        String tenantId = (userId == null || userId.isBlank()) ? "demo-user-id" : userId;
        return goalRepository.findByUserIdOrderByCreatedAtDesc(tenantId);
    }

    public Goal getGoalById(UUID id) {
        return goalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found: " + id));
    }

    @Transactional
    public Goal createGoal(CreateGoalRequest req) {
        Goal goal = Goal.builder()
                .userId(req.getUserId() != null && !req.getUserId().isBlank() ? req.getUserId() : "demo-user-id")
                .name(req.getName())
                .targetAmount(req.getTargetAmount() != null ? req.getTargetAmount() : BigDecimal.ZERO)
                .currentAmount(req.getCurrentAmount() != null ? req.getCurrentAmount() : BigDecimal.ZERO)
                .category(req.getCategory() != null ? req.getCategory() : "SAVINGS")
                .targetDate(req.getTargetDate())
                .color(req.getColor() != null ? req.getColor() : "#10b981")
                .icon(req.getIcon() != null ? req.getIcon() : "target")
                .build();
        return goalRepository.save(goal);
    }

    @Transactional
    public Goal updateGoal(UUID id, UpdateGoalRequest req) {
        Goal goal = getGoalById(id);
        if (req.getName() != null) goal.setName(req.getName());
        if (req.getTargetAmount() != null) goal.setTargetAmount(req.getTargetAmount());
        if (req.getCurrentAmount() != null) goal.setCurrentAmount(req.getCurrentAmount());
        if (req.getCategory() != null) goal.setCategory(req.getCategory());
        if (req.getTargetDate() != null) goal.setTargetDate(req.getTargetDate());
        if (req.getColor() != null) goal.setColor(req.getColor());
        if (req.getIcon() != null) goal.setIcon(req.getIcon());
        return goalRepository.save(goal);
    }

    @Transactional
    public void deleteGoal(UUID id) {
        goalRepository.deleteById(id);
    }
}
