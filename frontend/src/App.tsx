import React, { useState, useEffect } from 'react';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardPage } from './dashboard/DashboardPage';
import { AccountsView } from './components/AccountsView';
import { BudgetsView } from './components/BudgetsView';
import { TransactionsView } from './components/TransactionsView';
import { CashFlowView } from './components/CashFlowView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { GoalsView } from './components/GoalsView';
import { RulesView } from './components/RulesView';
import { HouseholdView } from './components/HouseholdView';
import { PricingView } from './components/PricingView';
import { AdminView } from './components/AdminView';
import { SettingsView } from './components/SettingsView';
import { SmartIngestModal } from './components/SmartIngestModal';
import { TransactionDrilldownModal } from './components/TransactionDrilldownModal';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { TransactionModal } from './components/TransactionModal';
import { AccountModal } from './components/AccountModal';
import { EnvelopeModal } from './components/EnvelopeModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { GoalModal } from './components/GoalModal';
import { api } from './services/api';
import {
  DashboardSummary,
  Account,
  BudgetEnvelope,
  Transaction,
  SplitGroup,
  Household,
  Subscription,
  Goal,
  SimplifiedDebtItem,
  TransactionFilter,
  NavTab,
} from './types';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const { formatAmount } = useCurrency();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Drilldown Filter & Navigation State
  const [activeFilter, setActiveFilter] = useState<TransactionFilter | undefined>(undefined);
  const [isSmartIngestOpen, setIsSmartIngestOpen] = useState(false);
  const [drilldownConfig, setDrilldownConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    transactions: Transaction[];
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    transactions: [],
  });

  const handleOpenDrilldown = (title: string, txs: Transaction[], subtitle?: string) => {
    setDrilldownConfig({
      isOpen: true,
      title,
      subtitle,
      transactions: txs,
    });
  };

  // CRUD Modals State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isEnvelopeModalOpen, setIsEnvelopeModalOpen] = useState(false);
  const [envelopeToEdit, setEnvelopeToEdit] = useState<BudgetEnvelope | null>(null);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  // Core Data States
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [envelopes, setEnvelopes] = useState<BudgetEnvelope[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
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
      const [sum, accs, envs, txs, grps, house, subs, debtsRes, gls] = await Promise.all([
        api.getDashboardSummary(),
        api.getAccounts(),
        api.getEnvelopes(),
        api.getTransactions(),
        api.getSplitGroups(),
        api.getHousehold(),
        api.getSubscriptions(),
        api.getSimplifiedDebts(),
        api.getGoals(),
      ]);
      setSummary(sum);
      setAccounts(accs);
      setEnvelopes(envs);
      setTransactions(txs);
      setGroups(grps);
      setHousehold(house);
      setSubscriptions(subs);
      setSimplifiedDebts(debtsRes.simplifiedPayments || []);
      setGoals(gls);
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

  // Envelope / Category CRUD handlers
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

  // Goal CRUD handlers
  const handleOpenAddGoal = () => {
    setGoalToEdit(null);
    setIsGoalModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsGoalModalOpen(true);
  };

  // Reset demo dataset
  const handleResetDemoData = async () => {
    if (!confirm('Reset ledger and seed clean realistic dataset?')) return;
    try {
      await api.resetSandbox();
      await refreshAllData();
      alert('Ledger restored to clean realistic seed data.');
    } catch (err) {
      console.error(err);
    }
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex font-sans antialiased transition-colors">
      {/* Left Collapsible & Clean Sidebar (PayLedger Layout) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'transactions') setActiveFilter(undefined);
          setCurrentTab(tab);
        }}
        onOpenAddTransaction={handleOpenAddTransaction}
        onResetDemoData={handleResetDemoData}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar on Canvas */}
        <TopBar
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          onOpenAddTransaction={handleOpenAddTransaction}
          onOpenSmartIngest={() => setIsSmartIngestOpen(true)}
          activeFilter={activeFilter}
          onClearFilter={() => setActiveFilter(undefined)}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#71717a] gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-neutral-300" />
              <span className="text-xs font-medium tracking-wide">Syncing financial workspace...</span>
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
                  goals={goals}
                  onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
                  onSimulatePaycheck={handleSimulatePaycheck}
                  onSimulateExpense={handleSimulateExpense}
                  onNavigateToTransactions={handleNavigateToTransactions}
                  onEditTransaction={handleEditTransaction}
                  onOpenDrilldown={handleOpenDrilldown}
                />
              )}
              {currentTab === 'accounts' && (
                <AccountsView
                  accounts={accounts}
                  transactions={transactions}
                  onRefresh={refreshAllData}
                  onOpenAddAccount={handleOpenAddAccount}
                  onEditAccount={handleEditAccount}
                  onNavigateToTransactions={handleNavigateToTransactions}
                  onOpenDrilldown={handleOpenDrilldown}
                  onOpenSmartIngest={() => setIsSmartIngestOpen(true)}
                />
              )}
              {currentTab === 'budgets' && (
                <BudgetsView
                  envelopes={envelopes}
                  transactions={transactions}
                  onRefresh={refreshAllData}
                  onOpenAddEnvelope={handleOpenAddEnvelope}
                  onEditEnvelope={handleEditEnvelope}
                  onNavigateToTransactions={handleNavigateToTransactions}
                  onOpenDrilldown={handleOpenDrilldown}
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
              {currentTab === 'cashflow' && (
                <CashFlowView
                  summary={summary}
                  transactions={transactions}
                  onNavigateToTransactions={handleNavigateToTransactions}
                  onOpenDrilldown={handleOpenDrilldown}
                />
              )}
              {currentTab === 'recurring' && (
                <SubscriptionsView
                  subscriptions={subscriptions}
                  onOpenAddSubscription={handleOpenAddSubscription}
                  onEditSubscription={handleEditSubscription}
                />
              )}
              {currentTab === 'goals' && (
                <GoalsView
                  goals={goals}
                  onRefresh={refreshAllData}
                  onOpenAddGoal={handleOpenAddGoal}
                  onEditGoal={handleEditGoal}
                />
              )}
              {currentTab === 'household' && (
                <HouseholdView
                  household={household}
                  onRefresh={refreshAllData}
                />
              )}
              {currentTab === 'rules' && (
                <RulesView />
              )}
              {currentTab === 'plans' && (
                <PricingView
                  formatCurrency={formatAmount}
                  onPlanChanged={refreshAllData}
                />
              )}
              {currentTab === 'admin' && (
                <AdminView />
              )}
              {currentTab === 'settings' && (
                <SettingsView
                  onOpenSmartIngest={() => setIsSmartIngestOpen(true)}
                  onRefreshAll={refreshAllData}
                  onNavigateToPlans={() => setCurrentTab('plans')}
                />
              )}
            </>
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-center text-[11px] text-[var(--fg-muted)] transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>PayLedger • Simple, minimal money management</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[var(--fg-muted)]">Local API Connected (:8088)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Quick Capture Modal (Ctrl+K) */}
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

      {/* Smart Ingest Open Banking & Statement Parser Hub */}
      <SmartIngestModal
        isOpen={isSmartIngestOpen}
        onClose={() => setIsSmartIngestOpen(false)}
        accounts={accounts}
        onSuccess={refreshAllData}
      />

      {/* Universal Traceability Transaction Drilldown Modal */}
      <TransactionDrilldownModal
        isOpen={drilldownConfig.isOpen}
        onClose={() => setDrilldownConfig((prev) => ({ ...prev, isOpen: false }))}
        title={drilldownConfig.title}
        subtitle={drilldownConfig.subtitle}
        transactions={drilldownConfig.transactions}
        onNavigateToTab={(tab, filter) => {
          setCurrentTab(tab);
          if (filter) setActiveFilter(filter);
        }}
        onEditTransaction={handleEditTransaction}
      />

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

      {/* Category Budget Add & Edit Modal */}
      <EnvelopeModal
        isOpen={isEnvelopeModalOpen}
        onClose={() => setIsEnvelopeModalOpen(false)}
        envelopeToEdit={envelopeToEdit}
        onSuccess={refreshAllData}
      />

      {/* Recurring Bill Add & Edit Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        accounts={accounts}
        subscriptionToEdit={subscriptionToEdit}
        onSuccess={refreshAllData}
      />

      {/* Financial Milestone Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goalToEdit={goalToEdit}
        onSuccess={refreshAllData}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
