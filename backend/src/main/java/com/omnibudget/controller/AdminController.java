package com.omnibudget.controller;

import com.omnibudget.dto.*;
import com.omnibudget.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/metrics")
    public ResponseEntity<AdminMetricsDto> getMetrics() {
        return ResponseEntity.ok(adminService.getMetrics());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDetailDto>> getUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<AdminUserDetailDto> createUser(@RequestBody CreateAdminUserRequest req) {
        return ResponseEntity.ok(adminService.createUser(req));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<AdminUserDetailDto> updateUser(
            @PathVariable UUID id,
            @RequestBody UpdateAdminUserRequest req) {
        return ResponseEntity.ok(adminService.updateUser(id, req));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully", "id", id.toString()));
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(adminService.getSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(adminService.updateSettings(updates));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<com.omnibudget.domain.AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(adminService.getAuditLogsByCategory(category, limit));
        }
        return ResponseEntity.ok(adminService.getAuditLogs(limit));
    }
}
