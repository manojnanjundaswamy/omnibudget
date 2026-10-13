import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  WalletCards,
  ReceiptText,
  Target,
  TrendingUp,
  CalendarClock,
  Trophy,
  Users2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  GripVertical,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Wand2,
  CreditCard,
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
  badge?: string;
}

const DEFAULT_NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: WalletCards },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
  { id: 'recurring', label: 'Recurring Bills', icon: CalendarClock },
  { id: 'goals', label: 'Goals', icon: Trophy },
  { id: 'rules', label: 'Rules', icon: Wand2, badge: 'Auto' },
  { id: 'household', label: 'Household', icon: Users2 },
  { id: 'plans', label: 'Plans & Pricing', icon: CreditCard, badge: 'Pro' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTransaction,
  onResetDemoData,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, isAuthenticated, isDemoMode, setIsAuthModalOpen, logout } = useAuth();
  const { currentCurrency, setCurrency, isPrivacyMode, togglePrivacyMode } = useCurrency();

  // Collapsible state (persisted)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('omnibudget_sidebar_collapsed') === 'true';
  });

  // Rearrangeable order state (persisted)
  const [navOrder, setNavOrder] = useState<NavTab[]>(() => {
    const allDefaultIds = DEFAULT_NAV_ITEMS.map((item) => item.id);
    try {
      const saved = localStorage.getItem('omnibudget_nav_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed.filter((id: any) => allDefaultIds.includes(id))];
          allDefaultIds.forEach((id) => {
            if (!merged.includes(id)) merged.push(id);
          });
          return merged;
        }
      }
    } catch (e) {
      // fallback
    }
    return allDefaultIds;
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('omnibudget_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }, [isCollapsed]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Reorder handling
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrder = [...navOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setNavOrder(newOrder);
    localStorage.setItem('omnibudget_nav_order', JSON.stringify(newOrder));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const orderedNavItems = navOrder
    .map((id) => DEFAULT_NAV_ITEMS.find((item) => item.id === id))
    .filter(Boolean) as NavItemDef[];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-[#0d0d0f] border-r border-[#1e1e24] transition-all duration-200 select-none ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Top Header: Brand + Collapse Toggle */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[#1e1e24] shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-400 text-black flex items-center justify-center font-black text-sm tracking-tighter shrink-0 shadow-sm">
                Ω
              </div>
              <div className="truncate">
                <span className="font-semibold text-sm tracking-tight text-[#f4f4f5] block">
                  OmniBudget
                </span>
                <span className="text-[10px] text-[#71717a] font-medium tracking-wide uppercase block">
                  {isAuthenticated ? 'Pro SaaS Workspace' : 'Guest Demo Workspace'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-400 text-black flex items-center justify-center font-black text-sm shrink-0">
              Ω
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#18181b] transition hidden lg:flex items-center justify-center"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Action Button (Monarch Money signature + Transaction button) */}
        <div className="p-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className={`w-full flex items-center justify-center gap-2 rounded-xl text-xs font-semibold bg-[#f4f4f5] hover:bg-white text-[#09090b] transition shadow-sm active:scale-[0.98] ${
              isCollapsed ? 'p-2.5' : 'py-2.5 px-3'
            }`}
            title="Record New Transaction"
          >
            <Plus className="w-4 h-4 text-black shrink-0" />
            {!isCollapsed && <span className="font-medium tracking-tight">New Transaction</span>}
          </button>
        </div>

        {/* Navigation Items (Rearrangeable) */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1 no-scrollbar">
          {orderedNavItems.map((item, index) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="group relative flex items-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#1e1e24] text-[#f4f4f5] font-semibold shadow-inner'
                      : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#141417]'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#f4f4f5]' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate tracking-tight flex-1 text-left">{item.label}</span>
                  )}
                </button>

                {/* Subtle drag handle in expanded mode */}
                {!isCollapsed && (
                  <span
                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab px-1 text-[#71717a] transition-opacity"
                    title="Drag to rearrange"
                  >
                    <GripVertical className="w-3 h-3" />
                  </span>
                )}

                {/* Hover Tooltip in collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#18181b] border border-[#27272a] text-[#f4f4f5] text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer: Currency, Privacy, Profile */}
        <div className="p-3 border-t border-[#1e1e24] shrink-0 space-y-2 bg-[#0d0d0f]">
          {/* Quick Controls: Currency & Privacy */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-1.5 px-1 py-1 rounded-lg bg-[#141417] border border-[#222228] text-[11px]">
              <div className="relative flex-1">
                <select
                  value={currentCurrency.code}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-transparent text-[#f4f4f5] text-[11px] font-medium pl-2 pr-5 py-1 appearance-none focus:outline-none cursor-pointer"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-[#18181b] text-white">
                      {curr.symbol} {curr.code}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#71717a] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={togglePrivacyMode}
                title={isPrivacyMode ? 'Disable Privacy Mode' : 'Enable Privacy Masking (Shift+H)'}
                className={`p-1.5 rounded-md transition ${
                  isPrivacyMode
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#1e1e24]'
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
                title="Toggle Privacy Mask"
                className={`p-2 rounded-lg transition ${
                  isPrivacyMode
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#18181b]'
                }`}
              >
                {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* User Account / Profile */}
          <div className="pt-1">
            {isAuthenticated ? (
              <div
                className={`flex items-center gap-2.5 p-1.5 rounded-xl bg-[#141417] border border-[#222228] transition ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  {!isCollapsed && (
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-[#f4f4f5] block truncate">
                          {currentUser?.name || currentUser?.email.split('@')[0]}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[9px] font-bold uppercase">
                          {currentUser?.plan || 'PRO'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#71717a] block truncate">
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
                    className="p-1 rounded-md text-[#71717a] hover:text-red-400 hover:bg-[#1e1e24] transition shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className={`w-full flex items-center gap-2 py-2 px-3 rounded-xl bg-[#141417] hover:bg-[#1a1a1f] border border-[#222228] text-xs font-medium text-[#f4f4f5] transition ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="Sign In / SaaS Workspace"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {!isCollapsed && <span>Sign In / SaaS</span>}
              </button>
            )}
          </div>

          {/* Discreet Demo Reset Tool */}
          {onResetDemoData && !isCollapsed && (
            <button
              type="button"
              onClick={onResetDemoData}
              className="w-full text-center text-[10px] text-[#52525b] hover:text-[#a1a1aa] transition py-0.5 flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset Clean Seed Data</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
