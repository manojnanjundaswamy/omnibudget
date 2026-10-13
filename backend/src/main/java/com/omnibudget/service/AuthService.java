package com.omnibudget.service;

import com.omnibudget.domain.*;
import com.omnibudget.dto.*;
import com.omnibudget.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final BudgetEnvelopeRepository envelopeRepository;
    private final EmailService emailService;

    public static final String DEMO_USER_ID = "demo-user-id";
    public static final String DEMO_USER_EMAIL = "demo@omnibudget.app";

    @Transactional
    public AuthResponse handleGoogleAuth(GoogleAuthRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        Optional<User> existing = userRepository.findByEmail(email);

        boolean isNew = false;
        User user;

        if (existing.isPresent()) {
            user = existing.get();
            if (req.getName() != null && !req.getName().isBlank()) user.setName(req.getName());
            if (req.getAvatarUrl() != null && !req.getAvatarUrl().isBlank()) user.setAvatarUrl(req.getAvatarUrl());
            user = userRepository.save(user);
        } else {
            isNew = true;
            user = User.builder()
                    .email(email)
                    .name(req.getName() != null && !req.getName().isBlank() ? req.getName() : email.split("@")[0])
                    .avatarUrl(req.getAvatarUrl())
                    .provider("GOOGLE")
                    .currency("USD")
                    .hasCompletedOnboarding(false)
                    .build();
            user = userRepository.save(user);
        }

        return AuthResponse.builder()
                .token("jwt-session-" + user.getId().toString())
                .user(user)
                .isNewUser(isNew || !Boolean.TRUE.equals(user.getHasCompletedOnboarding()))
                .message("Authenticated successfully via Google")
                .build();
    }

    @Transactional
    public AuthResponse handleEmailAuth(AuthRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        Optional<User> existing = userRepository.findByEmail(email);

        boolean isNew = false;
        User user;

        if (existing.isPresent()) {
            user = existing.get();
        } else {
            isNew = true;
            user = User.builder()
                    .email(email)
                    .name(req.getName() != null && !req.getName().isBlank() ? req.getName() : email.split("@")[0])
                    .password(req.getPassword()) // In production, hash with BCrypt
                    .provider("EMAIL")
                    .currency("USD")
                    .hasCompletedOnboarding(false)
                    .build();
            user = userRepository.save(user);
        }

        return AuthResponse.builder()
                .token("jwt-session-" + user.getId().toString())
                .user(user)
                .isNewUser(isNew || !Boolean.TRUE.equals(user.getHasCompletedOnboarding()))
                .message("Authenticated successfully via Email")
                .build();
    }

    @Transactional
    public AuthResponse sendOtp(OtpRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        Optional<User> existing = userRepository.findByEmail(email);

        User user;
        boolean isNew = false;
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            isNew = true;
            user = User.builder()
                    .email(email)
                    .name(req.getName() != null && !req.getName().isBlank() ? req.getName() : email.split("@")[0])
                    .provider("EMAIL")
                    .currency("USD")
                    .hasCompletedOnboarding(false)
                    .build();
        }

        String code = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
        user.setEmailOtp(code);
        user.setOtpExpiresAt(java.time.Instant.now().plus(10, java.time.temporal.ChronoUnit.MINUTES));
        user = userRepository.save(user);

        emailService.sendOtpEmail(email, code, user.getName());

        return AuthResponse.builder()
                .token(null)
                .user(user)
                .isNewUser(isNew)
                .message("Verification code sent to " + email)
                .build();
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account registered with " + email));

        if (user.getEmailOtp() == null || !user.getEmailOtp().equals(req.getCode().trim())) {
            throw new IllegalArgumentException("Invalid verification code");
        }

        if (user.getOtpExpiresAt() != null && java.time.Instant.now().isAfter(user.getOtpExpiresAt())) {
            throw new IllegalArgumentException("Verification code has expired. Please request a new code.");
        }

        // Clear OTP after successful verification
        user.setEmailOtp(null);
        user.setOtpExpiresAt(null);
        user.setLastLoginAt(java.time.Instant.now());
        user = userRepository.save(user);

        return AuthResponse.builder()
                .token("jwt-session-" + user.getId().toString())
                .user(user)
                .isNewUser(!Boolean.TRUE.equals(user.getHasCompletedOnboarding()))
                .message("Verified and signed in successfully")
                .build();
    }

    public User getCurrentUser(String userId) {
        if (userId == null || userId.isBlank() || DEMO_USER_ID.equals(userId)) {
            return getOrCreateDemoUser();
        }
        try {
            UUID id = UUID.fromString(userId);
            return userRepository.findById(id).orElseGet(this::getOrCreateDemoUser);
        } catch (IllegalArgumentException e) {
            return getOrCreateDemoUser();
        }
    }

    public User getOrCreateDemoUser() {
        return userRepository.findByEmail(DEMO_USER_EMAIL)
                .map(u -> {
                    if (!"ADMIN".equals(u.getRole())) {
                        u.setRole("ADMIN");
                        return userRepository.save(u);
                    }
                    return u;
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(DEMO_USER_EMAIL)
                        .name("Alex Chen (Admin)")
                        .provider("DEMO")
                        .currency("USD")
                        .plan("PRO")
                        .role("ADMIN")
                        .status("ACTIVE")
                        .hasCompletedOnboarding(true)
                        .build()));
    }

    @Transactional
    public User completeOnboarding(String userIdStr, OnboardingRequest req) {
        User user = getCurrentUser(userIdStr);

        if (req.getCurrency() != null && !req.getCurrency().isBlank()) {
            user.setCurrency(req.getCurrency());
        }
        user.setHasCompletedOnboarding(true);
        user = userRepository.save(user);

        String userTenantId = user.getId().toString();

        // 1. Create Initial Account if provided
        if (req.getInitialAccount() != null) {
            var accDto = req.getInitialAccount();
            Account account = Account.builder()
                    .userId(userTenantId)
                    .name(accDto.getName() != null ? accDto.getName() : "Primary Checking")
                    .institutionName(accDto.getInstitutionName() != null ? accDto.getInstitutionName() : "Main Bank")
                    .type(accDto.getType() != null ? accDto.getType() : AccountType.CHECKING)
                    .balance(accDto.getBalance() != null ? accDto.getBalance() : BigDecimal.ZERO)
                    .currency(user.getCurrency())
                    .color("#3b82f6")
                    .icon("wallet")
                    .isActive(true)
                    .build();
            accountRepository.save(account);
        }

        // 2. Create Initial Envelopes if provided
        if (req.getInitialEnvelopes() != null && !req.getInitialEnvelopes().isEmpty()) {
            for (var envDto : req.getInitialEnvelopes()) {
                BudgetEnvelope env = BudgetEnvelope.builder()
                        .userId(userTenantId)
                        .name(envDto.getName())
                        .groupType(envDto.getGroupType() != null ? envDto.getGroupType() : EnvelopeGroup.NEEDS)
                        .monthlyBudget(envDto.getMonthlyBudget() != null ? envDto.getMonthlyBudget() : BigDecimal.ZERO)
                        .spentAmount(BigDecimal.ZERO)
                        .rolloverSurplus(BigDecimal.ZERO)
                        .icon(envDto.getIcon() != null ? envDto.getIcon() : "tag")
                        .color(envDto.getColor() != null ? envDto.getColor() : "#10b981")
                        .build();
                envelopeRepository.save(env);
            }
        }

        return user;
    }
}
