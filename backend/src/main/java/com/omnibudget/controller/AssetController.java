package com.omnibudget.controller;

import com.omnibudget.domain.Asset;
import com.omnibudget.dto.AssetPortfolioSummaryDto;
import com.omnibudget.dto.CreateAssetRequest;
import com.omnibudget.dto.UpdateAssetRequest;
import com.omnibudget.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    public ResponseEntity<List<Asset>> getAssets(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(assetService.getAssets(userId));
    }

    @GetMapping("/summary")
    public ResponseEntity<AssetPortfolioSummaryDto> getPortfolioSummary(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(assetService.getPortfolioSummary(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAssetById(@PathVariable UUID id) {
        return ResponseEntity.ok(assetService.getAssetById(id));
    }

    @PostMapping
    public ResponseEntity<Asset> createAsset(
            @RequestBody CreateAssetRequest req,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (req.getUserId() == null || req.getUserId().isBlank()) {
            req.setUserId(userId != null ? userId : "demo-user-id");
        }
        return ResponseEntity.ok(assetService.createAsset(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Asset> updateAsset(
            @PathVariable UUID id,
            @RequestBody UpdateAssetRequest req) {
        return ResponseEntity.ok(assetService.updateAsset(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable UUID id) {
        assetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }
}
