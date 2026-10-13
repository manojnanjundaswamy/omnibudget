package com.omnibudget.service;

import com.omnibudget.domain.Asset;
import com.omnibudget.domain.AssetType;
import com.omnibudget.dto.AssetPortfolioSummaryDto;
import com.omnibudget.dto.CreateAssetRequest;
import com.omnibudget.dto.UpdateAssetRequest;
import com.omnibudget.repository.AssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepository assetRepository;

    @InjectMocks
    private AssetService assetService;

    private Asset sampleStock;
    private Asset sampleSip;

    @BeforeEach
    void setUp() {
        sampleStock = Asset.builder()
                .id(UUID.randomUUID())
                .userId("test-user")
                .name("Apple Inc.")
                .symbol("AAPL")
                .type(AssetType.STOCK)
                .quantity(new BigDecimal("10"))
                .buyPrice(new BigDecimal("150.00"))
                .currentPrice(new BigDecimal("200.00"))
                .investedAmount(new BigDecimal("1500.00"))
                .currentValue(new BigDecimal("2000.00"))
                .unrealizedGainLoss(new BigDecimal("500.00"))
                .unrealizedGainLossPercent(new BigDecimal("33.3333"))
                .currency("USD")
                .isActive(true)
                .build();

        sampleSip = Asset.builder()
                .id(UUID.randomUUID())
                .userId("test-user")
                .name("Index SIP")
                .symbol("VOO")
                .type(AssetType.SIP)
                .quantity(new BigDecimal("5"))
                .buyPrice(new BigDecimal("400.00"))
                .currentPrice(new BigDecimal("450.00"))
                .investedAmount(new BigDecimal("2000.00"))
                .currentValue(new BigDecimal("2250.00"))
                .unrealizedGainLoss(new BigDecimal("250.00"))
                .unrealizedGainLossPercent(new BigDecimal("12.5000"))
                .sipMonthlyContribution(new BigDecimal("300.00"))
                .sipDayOfMonth(5)
                .currency("USD")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Should create asset and automatically calculate invested amount and valuation")
    void testCreateAsset() {
        CreateAssetRequest req = CreateAssetRequest.builder()
                .userId("test-user")
                .name("Tesla")
                .symbol("TSLA")
                .type(AssetType.STOCK)
                .quantity(new BigDecimal("5"))
                .buyPrice(new BigDecimal("200.00"))
                .currentPrice(new BigDecimal("250.00"))
                .currency("USD")
                .build();

        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Asset result = assetService.createAsset(req);

        assertNotNull(result);
        assertEquals("Tesla", result.getName());
        assertEquals(new BigDecimal("1000.00"), result.getInvestedAmount());
        assertEquals(new BigDecimal("1250.00"), result.getCurrentValue());
        assertEquals(new BigDecimal("250.00"), result.getUnrealizedGainLoss());
        assertTrue(result.getUnrealizedGainLossPercent().compareTo(new BigDecimal("25.0000")) == 0);
        verify(assetRepository, times(1)).save(any(Asset.class));
    }

    @Test
    @DisplayName("Should aggregate portfolio summary across multiple assets and asset classes")
    void testGetPortfolioSummary() {
        when(assetRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc("test-user"))
                .thenReturn(List.of(sampleStock, sampleSip));

        AssetPortfolioSummaryDto summary = assetService.getPortfolioSummary("test-user");

        assertNotNull(summary);
        assertEquals(2, summary.getAssetCount());
        // 1500 + 2000 = 3500
        assertEquals(new BigDecimal("3500.00"), summary.getTotalInvested());
        // 2000 + 2250 = 4250
        assertEquals(new BigDecimal("4250.00"), summary.getTotalCurrentValue());
        // 4250 - 3500 = 750
        assertEquals(new BigDecimal("750.00"), summary.getTotalGainLoss());
        // Monthly SIP: 300
        assertEquals(new BigDecimal("300.00"), summary.getTotalMonthlySip());

        // Allocation breakdown
        assertNotNull(summary.getAllocationByType());
        assertEquals(new BigDecimal("2000.00"), summary.getAllocationByType().get("STOCK"));
        assertEquals(new BigDecimal("2250.00"), summary.getAllocationByType().get("SIP"));
    }

    @Test
    @DisplayName("Should update asset valuation when prices change")
    void testUpdateAsset() {
        UUID id = sampleStock.getId();
        when(assetRepository.findById(id)).thenReturn(Optional.of(sampleStock));
        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateAssetRequest updateReq = UpdateAssetRequest.builder()
                .currentPrice(new BigDecimal("220.00"))
                .build();

        Asset updated = assetService.updateAsset(id, updateReq);

        assertNotNull(updated);
        assertEquals(new BigDecimal("220.00"), updated.getCurrentPrice());
        assertEquals(new BigDecimal("2200.00"), updated.getCurrentValue());
        assertEquals(new BigDecimal("700.00"), updated.getUnrealizedGainLoss());
    }

    @Test
    @DisplayName("Should perform soft delete on asset")
    void testDeleteAsset() {
        UUID id = sampleStock.getId();
        when(assetRepository.findById(id)).thenReturn(Optional.of(sampleStock));

        assetService.deleteAsset(id);

        assertFalse(sampleStock.getIsActive());
        verify(assetRepository, times(1)).save(sampleStock);
    }
}
