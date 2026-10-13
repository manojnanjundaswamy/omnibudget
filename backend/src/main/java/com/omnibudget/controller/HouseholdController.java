package com.omnibudget.controller;

import com.omnibudget.domain.Household;
import com.omnibudget.dto.SmartOffsetResponse;
import com.omnibudget.service.HouseholdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/household")
@RequiredArgsConstructor
public class HouseholdController {

    private final HouseholdService householdService;

    @GetMapping
    public ResponseEntity<Household> getHousehold() {
        return ResponseEntity.ok(householdService.getCurrentHousehold());
    }

    @PutMapping("/salaries")
    public ResponseEntity<Household> updateSalaries(@RequestBody Map<String, BigDecimal> body) {
        BigDecimal salA = body.get("salaryA");
        BigDecimal salB = body.get("salaryB");
        BigDecimal jointTarget = body.get("jointTarget");
        return ResponseEntity.ok(householdService.updateSalaries(salA, salB, jointTarget));
    }

    @PostMapping("/cross-offset")
    public ResponseEntity<SmartOffsetResponse> executeCrossOffset(@RequestBody Map<String, BigDecimal> body) {
        BigDecimal amount = body.get("amount");
        return ResponseEntity.ok(householdService.executeCrossOffset(amount));
    }
}
