package com.omnibudget.controller;

import com.omnibudget.domain.Goal;
import com.omnibudget.dto.CreateGoalRequest;
import com.omnibudget.dto.UpdateGoalRequest;
import com.omnibudget.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public ResponseEntity<List<Goal>> getGoals(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(goalService.getGoals(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Goal> getGoal(@PathVariable UUID id) {
        return ResponseEntity.ok(goalService.getGoalById(id));
    }

    @PostMapping
    public ResponseEntity<Goal> createGoal(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody CreateGoalRequest req) {
        if (userId != null && !userId.isBlank()) req.setUserId(userId);
        return ResponseEntity.ok(goalService.createGoal(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Goal> updateGoal(
            @PathVariable UUID id,
            @RequestBody UpdateGoalRequest req) {
        return ResponseEntity.ok(goalService.updateGoal(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteGoal(@PathVariable UUID id) {
        goalService.deleteGoal(id);
        return ResponseEntity.ok(Map.of("message", "Goal deleted successfully"));
    }
}
