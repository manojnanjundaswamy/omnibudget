package com.omnibudget.service;

import com.omnibudget.domain.*;
import com.omnibudget.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BudgetEnvelopeRepository envelopeRepository;
    private final GoalRepository goalRepository;
    private final AccountRepository accountRepository;

    public List<Notification> getNotifications(String userIdStr) {
        UUID userId = parseUserId(userIdStr);
        List<Notification> list = userId != null
                ? notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                : notificationRepository.findAllByOrderByCreatedAtDesc();

        if (list.isEmpty()) {
            seedDefaultNotifications(userId);
            list = userId != null
                    ? notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                    : notificationRepository.findAllByOrderByCreatedAtDesc();
        }
        return list;
    }

    public long getUnreadCount(String userIdStr) {
        UUID userId = parseUserId(userIdStr);
        if (userId != null) {
            return notificationRepository.countByUserIdAndIsReadFalse(userId);
        }
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(n -> !Boolean.TRUE.equals(n.getIsRead()))
                .count();
    }

    @Transactional
    public Notification markAsRead(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userIdStr) {
        UUID userId = parseUserId(userIdStr);
        if (userId != null) {
            notificationRepository.markAllAsReadForUser(userId);
        } else {
            notificationRepository.markAllAsRead();
        }
    }

    @Transactional
    public void deleteNotification(UUID id) {
        notificationRepository.deleteById(id);
    }

    @Transactional
    public void clearAll(String userIdStr) {
        UUID userId = parseUserId(userIdStr);
        if (userId != null) {
            notificationRepository.deleteAllByUserId(userId);
        } else {
            notificationRepository.deleteAll();
        }
    }

    @Transactional
    public Notification createNotification(
            UUID userId,
            String title,
            String message,
            NotificationType type,
            NotificationSeverity severity,
            String targetTab,
            String targetId) {

        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .severity(severity)
                .targetTab(targetTab)
                .targetId(targetId)
                .isRead(false)
                .build();

        return notificationRepository.save(notification);
    }

    @Transactional
    public int scanAndGenerateAlerts(String userIdStr) {
        UUID userId = parseUserId(userIdStr);
        int alertsCreated = 0;
        LocalDate today = LocalDate.now();

        // 1. Scan Upcoming Subscriptions & Bills (within 3 days or today)
        List<Subscription> subs = subscriptionRepository.findAll();
        for (Subscription sub : subs) {
            if (sub.getNextBillingDate() != null) {
                try {
                    LocalDate dueDate = sub.getNextBillingDate();
                    long daysUntil = ChronoUnit.DAYS.between(today, dueDate);
                    if (daysUntil >= 0 && daysUntil <= 3) {
                        String title = daysUntil == 0
                                ? "Bill Due Today: " + sub.getName()
                                : "Upcoming Bill: " + sub.getName() + " in " + daysUntil + " day" + (daysUntil > 1 ? "s" : "");
                        String msg = String.format("%s renewal of $%s is due on %s.",
                                sub.getName(), sub.getAmount(), sub.getNextBillingDate().toString());

                        boolean alreadyExists = notificationRepository.findAll().stream()
                                .anyMatch(n -> n.getType() == NotificationType.BILL_DUE
                                        && sub.getId().toString().equals(n.getTargetId())
                                        && n.getTitle().contains(sub.getName()));

                        if (!alreadyExists) {
                            createNotification(userId, title, msg, NotificationType.BILL_DUE,
                                    daysUntil == 0 ? NotificationSeverity.ALERT : NotificationSeverity.WARNING,
                                    "recurring", sub.getId().toString());
                            alertsCreated++;
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }

        // 2. Scan Budget Envelopes for overruns
        List<BudgetEnvelope> envelopes = envelopeRepository.findAll();
        for (BudgetEnvelope env : envelopes) {
            if (env.getMonthlyBudget() != null && env.getSpentAmount() != null
                    && env.getMonthlyBudget().compareTo(BigDecimal.ZERO) > 0) {
                if (env.getSpentAmount().compareTo(env.getMonthlyBudget()) > 0) {
                    boolean alreadyExists = notificationRepository.findAll().stream()
                            .anyMatch(n -> n.getType() == NotificationType.BUDGET_EXCEEDED
                                    && env.getId().toString().equals(n.getTargetId()));

                    if (!alreadyExists) {
                        createNotification(
                                userId,
                                "Budget Exceeded: " + env.getName(),
                                String.format("You have spent $%s of your $%s allocation (+%s over limit).",
                                        env.getSpentAmount(), env.getMonthlyBudget(),
                                        env.getSpentAmount().subtract(env.getMonthlyBudget())),
                                NotificationType.BUDGET_EXCEEDED,
                                NotificationSeverity.ALERT,
                                "budgets",
                                env.getId().toString());
                        alertsCreated++;
                    }
                }
            }
        }

        // 3. Scan Goals for Milestones
        List<Goal> goals = goalRepository.findAll();
        for (Goal g : goals) {
            if (g.getTargetAmount() != null && g.getCurrentAmount() != null
                    && g.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
                if (g.getCurrentAmount().compareTo(g.getTargetAmount()) >= 0) {
                    boolean alreadyExists = notificationRepository.findAll().stream()
                            .anyMatch(n -> n.getType() == NotificationType.GOAL_MILESTONE
                                    && g.getId().toString().equals(n.getTargetId()));

                    if (!alreadyExists) {
                        createNotification(
                                userId,
                                "Milestone Achieved: " + g.getName(),
                                String.format("Congratulations! You've successfully reached 100%% of your $%s goal for %s.",
                                        g.getTargetAmount(), g.getName()),
                                NotificationType.GOAL_MILESTONE,
                                NotificationSeverity.SUCCESS,
                                "goals",
                                g.getId().toString());
                        alertsCreated++;
                    }
                }
            }
        }

        return alertsCreated;
    }

    private void seedDefaultNotifications(UUID userId) {
        createNotification(
                userId,
                "Welcome to OmniBudget",
                "Your zero vendor lock-in workspace is active. Explore your automated financial cockpit, cash flows, and bill radar.",
                NotificationType.SYSTEM,
                NotificationSeverity.INFO,
                "dashboard",
                null);

        createNotification(
                userId,
                "Bill Radar Active: Netflix Renewal",
                "Your subscription for Netflix ($15.99) is scheduled for renewal in 2 days.",
                NotificationType.BILL_DUE,
                NotificationSeverity.WARNING,
                "recurring",
                null);

        createNotification(
                userId,
                "Emergency Fund On Track",
                "Your 6-month safety buffer has reached 68% of target ($10,000 / $15,000).",
                NotificationType.GOAL_MILESTONE,
                NotificationSeverity.SUCCESS,
                "goals",
                null);
    }

    private UUID parseUserId(String userIdStr) {
        if (userIdStr == null || userIdStr.isBlank() || "demo-user-id".equalsIgnoreCase(userIdStr)) {
            return null;
        }
        try {
            return UUID.fromString(userIdStr);
        } catch (Exception e) {
            return null;
        }
    }
}
