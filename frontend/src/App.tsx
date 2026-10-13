import React, { useState, useEffect } from 'react';
import { CurrencyProvider } from './context/CurrencyContext';
import { Header, NavTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
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
      const [sum, accs, envs, txs, grps, house, subs] = await Promise.all([
        api.getDashboardSummary(),
        api.getAccounts(),
        api.getEnvelopes(),
        api.getTransactions(),
        api.getSplitGroups(),
        api.getHousehold(),
        api.getSubscriptions(),
      ]);
      setSummary(sum);
      setAccounts(accs);
      setEnvelopes(envs);
      setTransactions(txs);
      setGroups(grps);
      setHousehold(house);
      setSubscriptions(subs);
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
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navbar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm font-semibold tracking-wide">Syncing double-entry ledger...</span>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                summary={summary}
                transactions={transactions}
                accounts={accounts}
                onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
                onSimulatePaycheck={handleSimulatePaycheck}
                onSimulateExpense={handleSimulateExpense}
                onRefresh={refreshAllData}
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

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OmniBudget Enterprise Financial Engine • Architecture Code: OMNI-CORE-2026</span>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Spring Boot API :8088 Connected
            </span>
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
