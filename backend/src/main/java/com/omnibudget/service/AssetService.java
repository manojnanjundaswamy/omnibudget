package com.omnibudget.service;

import com.omnibudget.domain.Asset;
import com.omnibudget.domain.AssetType;
import com.omnibudget.dto.AssetPortfolioSummaryDto;
import com.omnibudget.dto.CreateAssetRequest;
import com.omnibudget.dto.UpdateAssetRequest;
import com.omnibudget.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;

    public List<Asset> getAssets(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "demo-user-id";
        List<Asset> assets = assetRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(effectiveUserId);
        if (assets.isEmpty() && "demo-user-id".equals(effectiveUserId)) {
            return assetRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        }
        return assets;
    }

    public Asset getAssetById(UUID id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found with id: " + id));
    }

    public AssetPortfolioSummaryDto getPortfolioSummary(String userId) {
        List<Asset> assets = getAssets(userId);

        BigDecimal totalInvested = BigDecimal.ZERO;
        BigDecimal totalCurrentValue = BigDecimal.ZERO;
        BigDecimal totalMonthlySip = BigDecimal.ZERO;
        Map<String, BigDecimal> allocation = new HashMap<>();

        for (Asset a : assets) {
            BigDecimal inv = a.getInvestedAmount() != null ? a.getInvestedAmount() : BigDecimal.ZERO;
            BigDecimal cur = a.getCurrentValue() != null ? a.getCurrentValue() : inv;
            totalInvested = totalInvested.add(inv);
            totalCurrentValue = totalCurrentValue.add(cur);

            if (a.getSipMonthlyContribution() != null) {
                totalMonthlySip = totalMonthlySip.add(a.getSipMonthlyContribution());
            }

            String typeKey = a.getType() != null ? a.getType().name() : "OTHER";
            allocation.put(typeKey, allocation.getOrDefault(typeKey, BigDecimal.ZERO).add(cur));
        }

        BigDecimal totalGainLoss = totalCurrentValue.subtract(totalInvested);
        BigDecimal totalGainLossPercent = BigDecimal.ZERO;
        if (totalInvested.compareTo(BigDecimal.ZERO) > 0) {
            totalGainLossPercent = totalGainLoss
                    .divide(totalInvested, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        String primaryCurrency = assets.isEmpty() ? "USD" : assets.get(0).getCurrency();

        return AssetPortfolioSummaryDto.builder()
                .totalInvested(totalInvested)
                .totalCurrentValue(totalCurrentValue)
                .totalGainLoss(totalGainLoss)
                .totalGainLossPercent(totalGainLossPercent)
                .totalMonthlySip(totalMonthlySip)
                .assetCount(assets.size())
                .currency(primaryCurrency)
                .allocationByType(allocation)
                .assets(assets)
                .build();
    }

    @Transactional
    public Asset createAsset(CreateAssetRequest req) {
        String effectiveUserId = (req.getUserId() != null && !req.getUserId().isBlank()) ? req.getUserId() : "demo-user-id";
        Asset asset = Asset.builder()
                .userId(effectiveUserId)
                .name(req.getName())
                .symbol(req.getSymbol())
                .type(req.getType() != null ? req.getType() : AssetType.OTHER)
                .quantity(req.getQuantity())
                .buyPrice(req.getBuyPrice())
                .currentPrice(req.getCurrentPrice())
                .investedAmount(req.getInvestedAmount())
                .currentValue(req.getCurrentValue())
                .sipMonthlyContribution(req.getSipMonthlyContribution())
                .sipDayOfMonth(req.getSipDayOfMonth())
                .currency(req.getCurrency() != null ? req.getCurrency() : "USD")
                .notes(req.getNotes())
                .accountId(req.getAccountId())
                .isActive(true)
                .build();

        asset.recalculateValuation();
        return assetRepository.save(asset);
    }

    @Transactional
    public Asset updateAsset(UUID id, UpdateAssetRequest req) {
        Asset asset = getAssetById(id);

        if (req.getName() != null && !req.getName().isBlank()) asset.setName(req.getName());
        if (req.getSymbol() != null) asset.setSymbol(req.getSymbol());
        if (req.getType() != null) asset.setType(req.getType());
        if (req.getQuantity() != null) asset.setQuantity(req.getQuantity());
        if (req.getBuyPrice() != null) asset.setBuyPrice(req.getBuyPrice());
        if (req.getCurrentPrice() != null) asset.setCurrentPrice(req.getCurrentPrice());
        if (req.getInvestedAmount() != null) asset.setInvestedAmount(req.getInvestedAmount());
        if (req.getCurrentValue() != null) asset.setCurrentValue(req.getCurrentValue());
        if (req.getSipMonthlyContribution() != null) asset.setSipMonthlyContribution(req.getSipMonthlyContribution());
        if (req.getSipDayOfMonth() != null) asset.setSipDayOfMonth(req.getSipDayOfMonth());
        if (req.getCurrency() != null && !req.getCurrency().isBlank()) asset.setCurrency(req.getCurrency());
        if (req.getNotes() != null) asset.setNotes(req.getNotes());
        if (req.getAccountId() != null) asset.setAccountId(req.getAccountId());

        asset.recalculateValuation();
        return assetRepository.save(asset);
    }

    @Transactional
    public void deleteAsset(UUID id) {
        Asset asset = getAssetById(id);
        asset.setIsActive(false);
        assetRepository.save(asset);
    }
}
