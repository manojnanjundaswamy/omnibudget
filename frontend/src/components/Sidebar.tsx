import React, { useState, useEffect } from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { NavTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddTransaction: () => void;
  onResetDemoData?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItemDef {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: 'money' | 'together' | 'app';
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  // Money
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'money' },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, section: 'money' },
  { id: 'budgets', label: 'Budgets', icon: PieChart, section: 'money' },
  { id: 'accounts', label: 'Accounts', icon: Wallet, section: 'money' },
  { id: 'recurring', label: 'Upcoming Bills', icon: CalendarClock, section: 'money' },
  { id: 'cashflow', label: 'Reports', icon: BarChart3, section: 'money' },

  // Together
  { id: 'household', label: 'Household & Split', icon: Users, section: 'together' },

  // App
  { id: 'admin', label: 'Admin Console', icon: ShieldCheck, section: 'app', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'app' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTransaction,
  onResetDemoData,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, isAuthenticated, logout, setIsAuthModalOpen } = useAuth();
  const { currentCurrency, setCurrency, isPrivacyMode, togglePrivacyMode } = useCurrency();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('omnibudget_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('omnibudget_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }, [isCollapsed]);

  const isAdmin = currentUser?.role === 'ADMIN';

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const sections: { key: NavItemDef['section']; title?: string }[] = [
    { key: 'money' },
    { key: 'together', title: 'Together' },
    { key: 'app', title: 'App' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-200 select-none ${
          isCollapsed ? 'w-[72px]' : 'w-60'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--border)] shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-[var(--fg)] text-[var(--bg)] flex items-center justify-center font-bold text-sm tracking-tighter shrink-0 shadow-sm">
                P
              </div>
              <div className="truncate">
                <span className="font-semibold text-sm tracking-tight text-[var(--fg)] block">
                  PayLedger
                </span>
                <span className="text-[10px] text-[var(--fg-muted)] block">
                  Simple Money
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-xl bg-[var(--fg)] text-[var(--bg)] flex items-center justify-center font-bold text-sm shrink-0">
              P
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition hidden lg:flex items-center justify-center"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Action: + Add Transaction */}
        <div className="p-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className={`w-full flex items-center justify-center gap-2 rounded-xl text-xs font-semibold bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] transition shadow-sm active:scale-[0.98] ${
              isCollapsed ? 'p-2.5' : 'py-2 px-3'
            }`}
            title="Record New Transaction"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Add Transaction</span>}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2 no-scrollbar">
          {sections.map((sec) => {
            const items = visibleItems.filter((i) => i.section === sec.key);
            if (items.length === 0) return null;

            return (
              <div key={sec.key} className="space-y-1">
                {sec.title && !isCollapsed && (
                  <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--fg-subtle)]">
                    {sec.title}
                  </div>
                )}

                {items.map((item) => {
                  const isActive = currentTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[var(--surface-2)] text-[var(--fg)] font-semibold shadow-xs'
                          : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      title={item.label}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate tracking-tight flex-1 text-left">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer: Currency, Privacy, Profile */}
        <div className="p-3 border-t border-[var(--border)] shrink-0 space-y-2 bg-[var(--surface)]">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px]">
              <div className="relative flex-1">
                <select
                  value={currentCurrency.code}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-transparent text-[var(--fg)] text-[11px] font-medium pr-5 py-0.5 appearance-none focus:outline-none cursor-pointer"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-[var(--surface)] text-[var(--fg)]">
                      {curr.symbol} {curr.code}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[var(--fg-muted)] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={togglePrivacyMode}
                title={isPrivacyMode ? 'Disable Privacy Blur' : 'Enable Privacy Blur (Shift+H)'}
                className={`p-1 rounded-lg transition ${
                  isPrivacyMode
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={togglePrivacyMode}
                title="Toggle Privacy Blur"
                className={`p-2 rounded-xl transition ${
                  isPrivacyMode
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* User Account Pill */}
          <div>
            {isAuthenticated ? (
              <div
                className={`flex items-center gap-2 p-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] transition ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-[var(--fg)] text-[var(--bg)] text-xs font-bold flex items-center justify-center shrink-0">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  {!isCollapsed && (
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-[var(--fg)] block truncate">
                          {currentUser?.name || currentUser?.email.split('@')[0]}
                        </span>
                        {currentUser?.role === 'ADMIN' && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 text-[9px] font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--fg-muted)] block truncate">
                        {currentUser?.email}
                      </span>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={logout}
                    title="Sign Out"
                    className="p-1 rounded-md text-[var(--fg-muted)] hover:text-rose-500 transition shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className={`w-full flex items-center gap-2 py-2 px-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs font-medium text-[var(--fg)] transition ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0" />
                {!isCollapsed && <span>Sign In</span>}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
