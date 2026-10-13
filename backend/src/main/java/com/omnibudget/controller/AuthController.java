package com.omnibudget.controller;

import com.omnibudget.domain.User;
import com.omnibudget.dto.*;
import com.omnibudget.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleAuth(@RequestBody GoogleAuthRequest req) {
        return ResponseEntity.ok(authService.handleGoogleAuth(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> emailAuth(@RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.handleEmailAuth(req));
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(authService.getCurrentUser(userId));
    }

    @PostMapping("/onboarding")
    public ResponseEntity<User> completeOnboarding(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody OnboardingRequest req) {
        return ResponseEntity.ok(authService.completeOnboarding(userId, req));
    }
}
