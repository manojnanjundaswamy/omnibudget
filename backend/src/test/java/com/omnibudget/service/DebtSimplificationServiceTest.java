package com.omnibudget.service;

import com.omnibudget.domain.PeerDebt;
import com.omnibudget.dto.DebtSimplificationResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DebtSimplificationServiceTest {

    private final DebtSimplificationService service = new DebtSimplificationService();

    @Test
    @DisplayName("Should handle empty debts list gracefully")
    void testEmptyDebts() {
        DebtSimplificationResponse response = service.simplify(Collections.emptyList());
        assertNotNull(response);
        assertEquals(0, response.getOriginalTransactionCount());
        assertEquals(0, response.getSimplifiedTransactionCount());
        assertEquals(BigDecimal.ZERO, response.getTotalDebtSettled());
        assertTrue(response.getSimplifiedPayments().isEmpty());
    }

    @Test
    @DisplayName("Should cancel circular debt where Alice owes Bob, Bob owes Charlie, Charlie owes Alice")
    void testCircularDebtCancellation() {
        PeerDebt d1 = PeerDebt.builder().fromUser("Alice").toUser("Bob").amount(new BigDecimal("50.00")).build();
        PeerDebt d2 = PeerDebt.builder().fromUser("Bob").toUser("Charlie").amount(new BigDecimal("50.00")).build();
        PeerDebt d3 = PeerDebt.builder().fromUser("Charlie").toUser("Alice").amount(new BigDecimal("50.00")).build();

        DebtSimplificationResponse response = service.simplify(List.of(d1, d2, d3));

        assertNotNull(response);
        assertEquals(3, response.getOriginalTransactionCount());
        // Circular debt nets to 0, so simplified transactions count is 0
        assertEquals(0, response.getSimplifiedTransactionCount());
        assertTrue(response.getSimplifiedPayments().isEmpty());
    }

    @Test
    @DisplayName("Should simplify transitive debt: A owes B $60, B owes C $60 -> A pays C $60 directly")
    void testTransitiveDebtSimplification() {
        PeerDebt d1 = PeerDebt.builder().fromUser("Alice").toUser("Bob").amount(new BigDecimal("60.00")).build();
        PeerDebt d2 = PeerDebt.builder().fromUser("Bob").toUser("Charlie").amount(new BigDecimal("60.00")).build();

        DebtSimplificationResponse response = service.simplify(List.of(d1, d2));

        assertNotNull(response);
        assertEquals(2, response.getOriginalTransactionCount());
        assertEquals(1, response.getSimplifiedTransactionCount());
        assertEquals(1, response.getSimplifiedPayments().size());

        var payment = response.getSimplifiedPayments().get(0);
        assertEquals("Alice", payment.getFromUser());
        assertEquals("Charlie", payment.getToUser());
        assertEquals(new BigDecimal("60.00"), payment.getAmount());
    }
}
