import React, { useState, useEffect } from 'react';
import { CurrencyProvider } from './context/CurrencyContext';
import { Header, NavTab } from './components/Header';
import { DashboardPage } from './dashboard/DashboardPage';
import { AccountsView } from './components/AccountsView';
import { BudgetsView } from './components/BudgetsView';
import { SplitsView } from './components/SplitsView';
import { HouseholdView } from './components/HouseholdView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { SandboxView } from './components/SandboxView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
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
} from './types';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    refreshAllData();
  }, []);

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
        onSelectTab={setCurrentTab}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#9e9e98] gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#ededed]" />
            <span className="text-xs font-medium tracking-wide">Syncing ledger...</span>
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
              />
            )}
            {currentTab === 'accounts' && (
              <AccountsView accounts={accounts} onRefresh={refreshAllData} />
            )}
            {currentTab === 'budgets' && (
              <BudgetsView envelopes={envelopes} onRefresh={refreshAllData} />
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
              <SubscriptionsView subscriptions={subscriptions} />
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

      {/* Minimal Footer */}
      <footer className="border-t border-[#1c1c1c] bg-[#0c0c0c] px-6 py-3 text-center text-[11px] text-[#6b6b66]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OmniBudget Core 2026</span>
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
    <CurrencyProvider>
      <AppContent />
    </CurrencyProvider>
  );
}
