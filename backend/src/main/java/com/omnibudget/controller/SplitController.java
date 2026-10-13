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
    public ResponseEntity<List<SplitGroup>> getAllGroups() {
        return ResponseEntity.ok(groupRepository.findAll());
    }

    @PostMapping("/groups")
    public ResponseEntity<SplitGroup> createGroup(@RequestBody SplitGroup group) {
        return ResponseEntity.ok(groupRepository.save(group));
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
