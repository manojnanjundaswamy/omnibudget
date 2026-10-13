package com.omnibudget.service;

import com.omnibudget.domain.*;
import com.omnibudget.dto.*;
import com.omnibudget.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LedgerServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private TransactionSplitRepository splitRepository;

    @Mock
    private BudgetEnvelopeRepository envelopeRepository;

    @Mock
    private SplitGroupRepository groupRepository;

    @Mock
    private PeerDebtRepository peerDebtRepository;

    @Mock
    private AssetRepository assetRepository;

    @InjectMocks
    private LedgerService ledgerService;

    private Account checkingAccount;
    private Account savingsAccount;
    private Account creditCardAccount;
    private BudgetEnvelope groceryEnvelope;

    @BeforeEach
    void setUp() {
        checkingAccount = Account.builder()
                .id(UUID.randomUUID())
                .userId("test-user")
                .name("Checking Account")
                .type(AccountType.CHECKING)
                .balance(new BigDecimal("5000.00"))
                .currency("USD")
                .isActive(true)
                .build();

        savingsAccount = Account.builder()
                .id(UUID.randomUUID())
                .userId("test-user")
                .name("Savings Account")
                .type(AccountType.SAVINGS)
                .balance(new BigDecimal("10000.00"))
                .currency("USD")
                .isActive(true)
                .build();

        creditCardAccount = Account.builder()
                .id(UUID.randomUUID())
                .userId("test-user")
                .name("Credit Card")
                .type(AccountType.CREDIT_CARD)
                .balance(new BigDecimal("-800.00"))
                .currency("USD")
                .isActive(true)
                .build();

        groceryEnvelope = BudgetEnvelope.builder()
                .id(UUID.randomUUID())
                .userId("test-user")
                .name("Groceries")
                .groupType(EnvelopeGroup.NEEDS)
                .monthlyBudget(new BigDecimal("600.00"))
                .spentAmount(new BigDecimal("150.00"))
                .build();
    }

    @Test
    @DisplayName("Should create account with specified properties")
    void testCreateAccount() {
        CreateAccountRequest req = CreateAccountRequest.builder()
                .userId("test-user")
                .name("New Cash Account")
                .type(AccountType.CASH_WALLET)
                .balance(new BigDecimal("200.00"))
                .currency("USD")
                .build();

        when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

        Account created = ledgerService.createAccount(req);

        assertNotNull(created);
        assertEquals("New Cash Account", created.getName());
        assertEquals(AccountType.CASH_WALLET, created.getType());
        assertEquals(new BigDecimal("200.00"), created.getBalance());
        verify(accountRepository, times(1)).save(any(Account.class));
    }

    @Test
    @DisplayName("Should execute balanced double-entry transfer between two accounts")
    void testExecuteTransfer() {
        when(accountRepository.findById(checkingAccount.getId())).thenReturn(Optional.of(checkingAccount));
        when(accountRepository.findById(savingsAccount.getId())).thenReturn(Optional.of(savingsAccount));

        TransferRequest req = TransferRequest.builder()
                .sourceAccountId(checkingAccount.getId())
                .targetAccountId(savingsAccount.getId())
                .amount(new BigDecimal("1000.00"))
                .description("Monthly emergency fund deposit")
                .build();

        ledgerService.executeTransfer(req);

        // Checking: 5000 - 1000 = 4000
        assertEquals(new BigDecimal("4000.00"), checkingAccount.getBalance());
        // Savings: 10000 + 1000 = 11000
        assertEquals(new BigDecimal("11000.00"), savingsAccount.getBalance());

        // Verify both accounts were saved
        verify(accountRepository, times(1)).save(checkingAccount);
        verify(accountRepository, times(1)).save(savingsAccount);
        // Verify twin transactions were persisted
        verify(transactionRepository, times(2)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should create expense transaction and update account balance and budget envelope")
    void testCreateExpenseTransaction() {
        when(accountRepository.findById(checkingAccount.getId())).thenReturn(Optional.of(checkingAccount));
        when(envelopeRepository.findById(groceryEnvelope.getId())).thenReturn(Optional.of(groceryEnvelope));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        CreateTransactionRequest req = CreateTransactionRequest.builder()
                .userId("test-user")
                .accountId(checkingAccount.getId())
                .envelopeId(groceryEnvelope.getId())
                .amount(new BigDecimal("50.00"))
                .type(TransactionType.EXPENSE)
                .category("Groceries")
                .merchant("Trader Joe's")
                .date(LocalDate.now())
                .build();

        Transaction tx = ledgerService.recordTransaction(req);

        assertNotNull(tx);
        // Checking account debited: 5000 - 50 = 4950
        assertEquals(new BigDecimal("4950.00"), checkingAccount.getBalance());
        // Grocery envelope spent amount increased: 150 + 50 = 200
        assertEquals(new BigDecimal("200.00"), groceryEnvelope.getSpentAmount());

        verify(accountRepository, times(1)).save(checkingAccount);
        verify(envelopeRepository, times(1)).save(groceryEnvelope);
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should accurately calculate dashboard summary, net worth, and investments")
    void testGetDashboardSummary() {
        when(accountRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtAsc("test-user"))
                .thenReturn(List.of(checkingAccount, savingsAccount, creditCardAccount));
        when(envelopeRepository.findByUserIdOrderByGroupTypeAscCreatedAtAsc("test-user"))
                .thenReturn(List.of(groceryEnvelope));
        when(assetRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc("test-user"))
                .thenReturn(List.of(
                        Asset.builder().currentValue(new BigDecimal("25000.00")).build()
                ));
        when(peerDebtRepository.findAll()).thenReturn(Collections.emptyList());
        when(transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc("test-user"))
                .thenReturn(Collections.emptyList());

        DashboardSummaryResponse summary = ledgerService.getDashboardSummary("test-user");

        assertNotNull(summary);
        // Liquid = 5000 (checking) + 10000 (savings) = 15000
        assertEquals(new BigDecimal("15000.00"), summary.getTotalLiquidAssets());
        // Liabilities = 800 (credit card abs)
        assertEquals(new BigDecimal("800.00"), summary.getTotalCreditLiabilities());
        // Investments = 25000 (from asset portfolio)
        assertEquals(new BigDecimal("25000.00"), summary.getTotalInvestments());
        // Net worth = 15000 + 25000 - 800 = 39200
        assertEquals(new BigDecimal("39200.00"), summary.getNetWorth());
        assertEquals(3, summary.getAccountCount());
        assertEquals(1, summary.getEnvelopeCount());
    }
}
