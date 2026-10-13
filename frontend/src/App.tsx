import React, { useState, useEffect } from 'react';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header, NavTab } from './components/Header';
import { DashboardPage } from './dashboard/DashboardPage';
import { AccountsView } from './components/AccountsView';
import { BudgetsView } from './components/BudgetsView';
import { TransactionsView } from './components/TransactionsView';
import { SplitsView } from './components/SplitsView';
import { HouseholdView } from './components/HouseholdView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { SandboxView } from './components/SandboxView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { TransactionModal } from './components/TransactionModal';
import { AccountModal } from './components/AccountModal';
import { EnvelopeModal } from './components/EnvelopeModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { api } from './services/api';
import {
  DashboardSummary,
  Account,
  BudgetEnvelope,
  Transaction,
  SplitGroup,
  Household,
  Subscription,
  SimplifiedDebtItem,
  TransactionFilter,
} from './types';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Drilldown Filter & Navigation State
  const [activeFilter, setActiveFilter] = useState<TransactionFilter | undefined>(undefined);

  // CRUD Modals State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isEnvelopeModalOpen, setIsEnvelopeModalOpen] = useState(false);
  const [envelopeToEdit, setEnvelopeToEdit] = useState<BudgetEnvelope | null>(null);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);

  // Core Data States
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [envelopes, setEnvelopes] = useState<BudgetEnvelope[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebtItem[]>([]);

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshAllData = async () => {
    try {
      setIsLoading(true);
      const [sum, accs, envs, txs, grps, house, subs, debtsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getAccounts(),
        api.getEnvelopes(),
        api.getTransactions(),
        api.getSplitGroups(),
        api.getHousehold(),
        api.getSubscriptions(),
        api.getSimplifiedDebts(),
      ]);
      setSummary(sum);
      setAccounts(accs);
      setEnvelopes(envs);
      setTransactions(txs);
      setGroups(grps);
      setHousehold(house);
      setSubscriptions(subs);
      setSimplifiedDebts(debtsRes.simplifiedPayments || []);
    } catch (err) {
      console.error('Error fetching data from Spring Boot backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload data whenever active user session changes
  useEffect(() => {
    refreshAllData();
  }, [currentUser?.id]);

  // Click-through drilldown navigation
  const handleNavigateToTransactions = (filter?: TransactionFilter) => {
    setActiveFilter(filter);
    setCurrentTab('transactions');
  };

  // Transaction CRUD handlers
  const handleOpenAddTransaction = () => {
    setTransactionToEdit(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsTransactionModalOpen(true);
  };

  // Account CRUD handlers
  const handleOpenAddAccount = () => {
    setAccountToEdit(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (acc: Account) => {
    setAccountToEdit(acc);
    setIsAccountModalOpen(true);
  };

  // Envelope CRUD handlers
  const handleOpenAddEnvelope = () => {
    setEnvelopeToEdit(null);
    setIsEnvelopeModalOpen(true);
  };

  const handleEditEnvelope = (env: BudgetEnvelope) => {
    setEnvelopeToEdit(env);
    setIsEnvelopeModalOpen(true);
  };

  // Subscription CRUD handlers
  const handleOpenAddSubscription = () => {
    setSubscriptionToEdit(null);
    setIsSubscriptionModalOpen(true);
  };

  const handleEditSubscription = (sub: Subscription) => {
    setSubscriptionToEdit(sub);
    setIsSubscriptionModalOpen(true);
  };

  const handleSimulatePaycheck = async () => {
    try {
      await api.simulatePaycheck();
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateExpense = async () => {
    try {
      await api.simulateExpense();
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f4] flex flex-col font-sans antialiased">
      {/* Navbar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'transactions') setActiveFilter(undefined);
          setCurrentTab(tab);
        }}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#9e9e98] gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#ededed]" />
            <span className="text-xs font-medium tracking-wide">Syncing SaaS ledger...</span>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardPage
                summary={summary}
                transactions={transactions}
                accounts={accounts}
                envelopes={envelopes}
                subscriptions={subscriptions}
                household={household}
                simplifiedDebts={simplifiedDebts}
                onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
                onSimulatePaycheck={handleSimulatePaycheck}
                onSimulateExpense={handleSimulateExpense}
                onNavigateToTransactions={handleNavigateToTransactions}
                onEditTransaction={handleEditTransaction}
              />
            )}
            {currentTab === 'accounts' && (
              <AccountsView
                accounts={accounts}
                onRefresh={refreshAllData}
                onOpenAddAccount={handleOpenAddAccount}
                onEditAccount={handleEditAccount}
                onNavigateToTransactions={handleNavigateToTransactions}
              />
            )}
            {currentTab === 'budgets' && (
              <BudgetsView
                envelopes={envelopes}
                onRefresh={refreshAllData}
                onOpenAddEnvelope={handleOpenAddEnvelope}
                onEditEnvelope={handleEditEnvelope}
                onNavigateToTransactions={handleNavigateToTransactions}
              />
            )}
            {currentTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                accounts={accounts}
                envelopes={envelopes}
                initialFilter={activeFilter}
                onRefresh={refreshAllData}
                onOpenAddModal={handleOpenAddTransaction}
                onEditTransaction={handleEditTransaction}
              />
            )}
            {currentTab === 'splits' && (
              <SplitsView
                groups={groups}
                accounts={accounts}
                onRefresh={refreshAllData}
                onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
              />
            )}
            {currentTab === 'household' && (
              <HouseholdView household={household} onRefresh={refreshAllData} />
            )}
            {currentTab === 'subscriptions' && (
              <SubscriptionsView
                subscriptions={subscriptions}
                onOpenAddSubscription={handleOpenAddSubscription}
                onEditSubscription={handleEditSubscription}
              />
            )}
            {currentTab === 'sandbox' && <SandboxView onRefresh={refreshAllData} />}
          </>
        )}
      </main>

      {/* Quick Capture Command Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        accounts={accounts}
        envelopes={envelopes}
        groups={groups}
        onSuccess={refreshAllData}
      />

      {/* SaaS Authentication Modal */}
      <AuthModal />

      {/* 3-Step Guided Onboarding Wizard Modal */}
      <OnboardingWizardModal onComplete={refreshAllData} />

      {/* Transaction Add & Edit Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        accounts={accounts}
        envelopes={envelopes}
        transactionToEdit={transactionToEdit}
        onSuccess={refreshAllData}
      />

      {/* Account Add & Edit Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accountToEdit={accountToEdit}
        onSuccess={refreshAllData}
      />

      {/* Envelope Add & Edit Modal */}
      <EnvelopeModal
        isOpen={isEnvelopeModalOpen}
        onClose={() => setIsEnvelopeModalOpen(false)}
        envelopeToEdit={envelopeToEdit}
        onSuccess={refreshAllData}
      />

      {/* Subscription Add & Edit Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        accounts={accounts}
        subscriptionToEdit={subscriptionToEdit}
        onSuccess={refreshAllData}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-[#1c1c1c] bg-[#0c0c0c] px-6 py-3 text-center text-[11px] text-[#6b6b66]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OmniBudget SaaS Platform 2026</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[#9e9e98]">Spring Boot API :8088</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AppContent />
      </CurrencyProvider>
    </AuthProvider>
  );
}
