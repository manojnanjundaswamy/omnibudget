import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Wallet,
  CalendarClock,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
  Plus,
  MoreHorizontal,
  TrendingUp,
  Calculator,
  X,
} from 'lucide-react';
import { NavTab } from '../types';

interface MobileTabBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddTransaction: () => void;
  isAdmin?: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTransaction,
  isAdmin,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const moreItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'assets', label: 'Investments', icon: TrendingUp },
    { id: 'recurring', label: 'Bills', icon: CalendarClock },
    { id: 'cashflow', label: 'Reports', icon: BarChart3 },
    { id: 'household', label: 'Household', icon: Users },
    { id: 'utilities', label: 'Utilities', icon: Calculator },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(isAdmin ? [{ id: 'admin' as NavTab, label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <>
      {/* Fixed Bottom Tab Bar (Visible on mobile only: md:hidden) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      >
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition ${
            currentTab === 'dashboard'
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        {/* Transactions */}
        <button
          type="button"
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition ${
            currentTab === 'transactions'
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span>Transactions</span>
        </button>

        {/* Elevated Center '+' Button */}
        <div className="flex flex-1 items-center justify-center px-1">
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="-mt-5 flex w-12 h-12 items-center justify-center rounded-full bg-[var(--accent)] hover:opacity-95 text-[var(--accent-fg)] shadow-lg transition transform active:scale-90"
            aria-label="Add transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Budgets */}
        <button
          type="button"
          onClick={() => onSelectTab('budgets')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition ${
            currentTab === 'budgets'
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span>Budgets</span>
        </button>

        {/* More */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition ${
            isMoreOpen || (currentTab !== 'dashboard' && currentTab !== 'transactions' && currentTab !== 'budgets')
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* "More" Drawer / Modal */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Modal / Sheet Panel */}
          <div className="relative z-10 w-full max-h-[80vh] overflow-y-auto rounded-t-3xl bg-[var(--surface)] border-t border-[var(--border)] p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div>
                <h3 className="font-semibold text-base text-[var(--fg)]">More Options</h3>
                <p className="text-xs text-[var(--fg-muted)]">Jump to any tool or workspace</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition active:scale-95 ${
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--fg)] font-semibold'
                        : 'border-[var(--border)] bg-[var(--surface-2)]/50 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--fg-muted)]'}`} />
                    <span className="text-xs truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
