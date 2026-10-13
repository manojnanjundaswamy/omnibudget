import React from 'react';
import { Menu, Search, Plus, ShieldCheck, Sparkles, Filter, X } from 'lucide-react';
import { NavTab, TransactionFilter } from '../types';

interface TopBarProps {
  currentTab: NavTab;
  onOpenMobileSidebar: () => void;
  onOpenQuickCapture: () => void;
  onOpenAddTransaction: () => void;
  activeFilter?: TransactionFilter;
  onClearFilter?: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Financial Dashboard',
    subtitle: 'Real-time liquidity, cash flow radar, and net worth engine',
  },
  accounts: {
    title: 'Accounts & Liquidity',
    subtitle: 'Checking, high-yield savings, credit cards, and investment holdings',
  },
  transactions: {
    title: 'Master Ledger',
    subtitle: 'Complete double-entry transaction activity and audit log',
  },
  budgets: {
    title: 'Monthly Category Budgets',
    subtitle: 'Target spending plans and real-time category progress tracking',
  },
  cashflow: {
    title: 'Cash Flow & Savings Rate',
    subtitle: 'Monthly income vs expenses, net savings, and financial velocity',
  },
  recurring: {
    title: 'Recurring Bills & Subscriptions',
    subtitle: 'Anticipated upcoming regular charges and renewal radar',
  },
  goals: {
    title: 'Financial Goals & Milestones',
    subtitle: 'Long-term savings targets, emergency reserves, and milestones',
  },
  household: {
    title: 'Household & Partner Sharing',
    subtitle: 'Proportional joint contributions and shared expense pool',
  },
  rules: {
    title: 'Automated Categorization Rules',
    subtitle: 'Monarch-grade rules engine to automatically categorize and clean transactions',
  },
  plans: {
    title: 'Subscription & SaaS Plans',
    subtitle: 'Transparent tier pricing, active plan entitlements, and quota usage',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onOpenQuickCapture,
  onOpenAddTransaction,
  activeFilter,
  onClearFilter,
}) => {
  const meta = TAB_TITLES[currentTab] || { title: 'Workspace', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md border-b border-[#1e1e24] px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-2 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#141417] lg:hidden transition"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-[#f4f4f5]">{meta.title}</h1>
              {activeFilter && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1e1e24] border border-[#2e2e38] text-[11px] text-[#a1a1aa]">
                  <Filter className="w-3 h-3 text-emerald-400" />
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
                      className="hover:text-red-400 transition"
                      title="Clear Filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-[#71717a] hidden sm:block mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right: Search Shortcut & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Shortcut (Ctrl+K) */}
          <button
            type="button"
            onClick={onOpenQuickCapture}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141417] hover:bg-[#1a1a1f] border border-[#222228] text-xs text-[#71717a] hover:text-[#f4f4f5] transition"
            title="Quick Capture or Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <span className="hidden md:inline text-[11px]">Quick Action</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#1e1e24] border border-[#2c2c34] rounded text-[#a1a1aa]">
              Ctrl K
            </kbd>
          </button>

          {/* Quick Record Transaction Button */}
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4f4f5] hover:bg-white text-[#09090b] text-xs font-semibold transition active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Transaction</span>
          </button>
        </div>
      </div>
    </header>
  );
};
