import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  Users2,
  Home,
  CalendarDays,
  Sparkles,
  Eye,
  EyeOff,
  Command,
  ChevronDown,
  Receipt,
  User as UserIcon,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'accounts'
  | 'budgets'
  | 'transactions'
  | 'splits'
  | 'household'
  | 'subscriptions'
  | 'sandbox';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickCapture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickCapture,
}) => {
  const { currentCurrency, setCurrency, isPrivacyMode, togglePrivacyMode } = useCurrency();
  const { currentUser, isAuthenticated, isDemoMode, setIsAuthModalOpen, logout } = useAuth();

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'accounts', label: 'Accounts', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'budgets', label: 'Envelopes', icon: <PiggyBank className="w-3.5 h-3.5" /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'splits', label: 'Peer Splits', icon: <Users2 className="w-3.5 h-3.5" /> },
    { id: 'household', label: 'Household', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'subscriptions', label: 'Bills', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: 'sandbox', label: 'Sandbox', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#242424] px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-black text-sm">
            Ω
          </div>
          <div>
            <span className="font-semibold text-[#f5f5f4] tracking-tight text-sm">OmniBudget</span>
          </div>
        </div>

        {/* Minimal Navigation Pills */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-[#242424]">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-[#222222] text-[#f5f5f4] font-medium shadow-sm'
                    : 'text-[#8e8e8e] hover:text-[#f5f5f4] hover:bg-[#1a1a1a]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Auth, Quick Capture, Privacy Shield, Currency */}
        <div className="flex items-center gap-2">
          {/* Quick Capture Ctrl+K */}
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] border border-[#242424] text-[#f5f5f4] text-xs font-medium transition"
            title="Press Ctrl+K to quick capture"
          >
            <Command className="w-3.5 h-3.5 text-[#8e8e8e]" />
            <span className="hidden sm:inline">Log</span>
            <kbd className="hidden xl:inline text-[10px] bg-[#222222] px-1.5 py-0.2 rounded text-[#8e8e8e] border border-[#2e2e2e]">
              Ctrl+K
            </kbd>
          </button>

          {/* Privacy Shield Toggle */}
          <button
            onClick={togglePrivacyMode}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isPrivacyMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-[#141414] border-[#242424] text-[#8e8e8e] hover:text-[#f5f5f4] hover:bg-[#1a1a1a]'
            }`}
            title="Privacy Shield (blur amounts)"
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Multi-Currency Dropdown */}
          <div className="relative">
            <select
              value={currentCurrency.code}
              onChange={(e) => setCurrency(e.target.value)}
              className="appearance-none bg-[#141414] hover:bg-[#1a1a1a] border border-[#242424] text-[#f5f5f4] text-xs font-medium rounded-lg pl-2.5 pr-6 py-1.5 cursor-pointer focus:outline-none focus:border-[#3a3a3a]"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code} className="bg-[#141414] text-[#f5f5f4]">
                  {curr.symbol} {curr.code}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#8e8e8e] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* User Auth Profile / SaaS Login Trigger */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#242424]">
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#141414] border border-[#242424] text-xs cursor-pointer hover:bg-[#1a1a1a] transition"
                title={`Signed in as ${currentUser?.email}`}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-[#f5f5f4] text-[11px] font-medium hidden sm:inline max-w-[100px] truncate">
                  {currentUser?.name || currentUser?.email.split('@')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-red-400 hover:bg-[#1a1a1a] transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] border border-[#242424] text-xs font-medium text-[#f5f5f4] transition"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Sign In / SaaS</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile subnav */}
      <div className="flex lg:hidden overflow-x-auto gap-1 mt-2 pb-1 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap ${
              currentTab === item.id
                ? 'bg-[#222222] text-[#f5f5f4] font-medium'
                : 'text-[#8e8e8e] bg-[#141414]'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
