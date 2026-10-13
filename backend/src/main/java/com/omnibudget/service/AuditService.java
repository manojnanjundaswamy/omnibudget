package com.omnibudget.service;

import com.omnibudget.domain.AuditLog;
import com.omnibudget.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog logEvent(
            UUID userId,
            String userEmail,
            String userName,
            String action,
            String category,
            String description,
            String severity,
            String metadataJson,
            String ipAddress) {

        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .userEmail(userEmail != null ? userEmail : "system@omnibudget.internal")
                .userName(userName != null ? userName : "OmniUser")
                .action(action)
                .category(category)
                .description(description)
                .severity(severity != null ? severity : "INFO")
                .metadataJson(metadataJson)
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("[AUDIT] [{}] [{}] User: {} <{}> - {}", category, action, saved.getUserName(), saved.getUserEmail(), description);
        return saved;
    }

    @Transactional
    public AuditLog logEvent(UUID userId, String userEmail, String userName, String action, String category, String description) {
        return logEvent(userId, userEmail, userName, action, category, description, "INFO", null, "127.0.0.1");
    }

    @Transactional
    public AuditLog logEvent(String userEmail, String action, String category, String description) {
        return logEvent(null, userEmail, userEmail, action, category, description, "INFO", null, "127.0.0.1");
    }

    public List<AuditLog> getRecentLogs(int limit) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.min(limit, 200)));
    }

    public List<AuditLog> getLogsByCategory(String category, int limit) {
        return auditLogRepository.findByCategoryOrderByCreatedAtDesc(category, PageRequest.of(0, Math.min(limit, 200)));
    }

    public List<AuditLog> getLogsByUser(UUID userId, int limit) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, Math.min(limit, 200)));
    }
}
