package com.omnibudget.controller;

import com.omnibudget.domain.PeerDebt;
import com.omnibudget.domain.SplitGroup;
import com.omnibudget.dto.DebtSimplificationResponse;
import com.omnibudget.dto.SettlementRequest;
import com.omnibudget.repository.PeerDebtRepository;
import com.omnibudget.repository.SplitGroupRepository;
import com.omnibudget.service.DebtSimplificationService;
import com.omnibudget.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/splits")
@RequiredArgsConstructor
public class SplitController {

    private final SplitGroupRepository groupRepository;
    private final PeerDebtRepository peerDebtRepository;
    private final DebtSimplificationService debtSimplificationService;
    private final LedgerService ledgerService;

    @GetMapping("/groups")
    public ResponseEntity<List<SplitGroup>> getAllGroups(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null || userId.isBlank() || "demo-user-id".equals(userId)) {
            List<SplitGroup> userGroups = groupRepository.findByUserId("demo-user-id");
            return ResponseEntity.ok(userGroups.isEmpty() ? groupRepository.findAll() : userGroups);
        }
        return ResponseEntity.ok(groupRepository.findByUserId(userId));
    }

    @PostMapping("/groups")
    public ResponseEntity<SplitGroup> createGroup(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody SplitGroup group) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        group.setUserId(effectiveUserId);
        return ResponseEntity.ok(groupRepository.save(group));
    }

    @DeleteMapping("/groups/{id}")
    public ResponseEntity<Map<String, String>> deleteGroup(@PathVariable UUID id) {
        groupRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Split group deleted successfully"));
    }

    @GetMapping("/debts")
    public ResponseEntity<List<PeerDebt>> getAllDebts(@RequestParam(required = false) UUID groupId) {
        if (groupId != null) {
            return ResponseEntity.ok(peerDebtRepository.findBySplitGroupId(groupId));
        }
        return ResponseEntity.ok(peerDebtRepository.findAll());
    }

    @GetMapping("/simplify")
    public ResponseEntity<DebtSimplificationResponse> getSimplifiedDebts(@RequestParam(required = false) UUID groupId) {
        List<PeerDebt> debts = (groupId != null)
                ? peerDebtRepository.findBySplitGroupId(groupId)
                : peerDebtRepository.findAll();
        return ResponseEntity.ok(debtSimplificationService.simplify(debts));
    }

    @PostMapping("/settle")
    public ResponseEntity<Map<String, String>> settleDebt(@RequestBody SettlementRequest req) {
        ledgerService.settleDebt(req);
        return ResponseEntity.ok(Map.of("message", "Debt settlement logged successfully"));
    }
}
