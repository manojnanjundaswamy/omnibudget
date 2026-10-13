import React from 'react';
import { Menu, Search, Plus, Sparkles, Filter, X, Sun, Moon, Calculator } from 'lucide-react';
import { NavTab, TransactionFilter } from '../types';
import { useTheme } from '../context/ThemeContext';
import { NotificationCenter } from './NotificationCenter';

interface TopBarProps {
  currentTab: NavTab;
  onOpenMobileSidebar: () => void;
  onOpenQuickCapture: () => void;
  onOpenAddTransaction: () => void;
  onOpenSmartIngest?: () => void;
  onOpenUtilities?: () => void;
  onNavigateTab?: (tab: NavTab) => void;
  onOpenSettings?: () => void;
  activeFilter?: TransactionFilter;
  onClearFilter?: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Where you stand today',
  },
  transactions: {
    title: 'Transactions',
    subtitle: 'Every expense, income and transfer',
  },
  budgets: {
    title: 'Budgets',
    subtitle: 'What you plan to spend this month',
  },
  accounts: {
    title: 'Accounts',
    subtitle: 'Your banks, cash and credit cards',
  },
  assets: {
    title: 'Assets & Investments',
    subtitle: 'Stocks, SIPs, mutual funds and precious metals',
  },
  recurring: {
    title: 'Upcoming Bills',
    subtitle: 'Upcoming regular bills and renewal dates',
  },
  cashflow: {
    title: 'Reports',
    subtitle: 'Where your money went this month',
  },
  household: {
    title: 'Household & Split',
    subtitle: 'Shared expenses with family or roommates',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Theme, currency, appearance, and data preferences',
  },
  admin: {
    title: 'Admin Console',
    subtitle: 'User accounts, memberships, and platform settings',
  },
  goals: {
    title: 'Goals',
    subtitle: 'Savings milestones and emergency funds',
  },
  rules: {
    title: 'Rules',
    subtitle: 'Automatic category rules for transactions',
  },
  plans: {
    title: 'Plans & Pricing',
    subtitle: 'Choose the membership that fits you',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onOpenQuickCapture,
  onOpenAddTransaction,
  onOpenSmartIngest,
  onOpenUtilities,
  onNavigateTab,
  onOpenSettings,
  activeFilter,
  onClearFilter,
}) => {
  const meta = TAB_TITLES[currentTab] || { title: 'Workspace', subtitle: '' };
  const { resolvedMode, toggleMode } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
      <div className="w-full max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-2 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] lg:hidden transition"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-tight text-[var(--fg)]">{meta.title}</h1>
              {activeFilter && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--fg-muted)]">
                  <Filter className="w-3 h-3 text-emerald-500" />
                  <span>
                    Filtered:{' '}
                    {activeFilter.category ||
                      (activeFilter.accountId ? 'Account' : '') ||
                      activeFilter.type ||
                      'Active'}
                  </span>
                  {onClearFilter && (
                    <button
                      type="button"
                      onClick={onClearFilter}
                      className="hover:text-red-500 transition ml-0.5"
                      title="Clear Filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--fg-muted)] hidden sm:block mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Search Shortcut (Ctrl+K) */}
          <button
            type="button"
            onClick={onOpenQuickCapture}
            className="interactive-btn flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] shadow-xs"
            title="Quick Action or Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[var(--fg-muted)] transition-transform group-hover:scale-110" />
            <span className="hidden md:inline text-[11px]">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--fg-muted)] shadow-2xs">
              Ctrl K
            </kbd>
          </button>

          {/* Real-Time Notification & Alert Center */}
          <NotificationCenter
            onNavigateTab={onNavigateTab}
            onOpenSettings={onOpenSettings}
          />

          {/* Finance Utilities & Calculator Floating System */}
          {onOpenUtilities && (
            <button
              type="button"
              onClick={onOpenUtilities}
              className="interactive-btn p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] group"
              title="Finance Utilities & Floating Calculator"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-400 transition-transform duration-300 group-hover:scale-110" />
            </button>
          )}

          {/* Theme Quick Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleMode}
            className="interactive-btn p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] group"
            title={`Switch to ${resolvedMode === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {resolvedMode === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[var(--fg)] transition-transform duration-300 group-hover:-rotate-45 group-hover:scale-110" />
            )}
          </button>

          {/* Smart Ingest Open Hub */}
          {onOpenSmartIngest && (
            <button
              type="button"
              onClick={onOpenSmartIngest}
              className="interactive-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg)] text-xs font-medium shadow-xs group"
              title="Import bank statements or SMS notifications"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              <span className="hidden sm:inline">Import</span>
            </button>
          )}

          {/* Quick Record Transaction Button */}
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="interactive-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-semibold shadow-xs group"
          >
            <Plus className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-90" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
};
