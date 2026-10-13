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
} from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';

export type NavTab = 'dashboard' | 'accounts' | 'budgets' | 'splits' | 'household' | 'subscriptions' | 'sandbox';

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

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Cockpit', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'accounts', label: 'Accounts', icon: <Wallet className="w-4 h-4" /> },
    { id: 'budgets', label: 'Envelopes', icon: <PiggyBank className="w-4 h-4" /> },
    { id: 'splits', label: 'Peer Splits', icon: <Users2 className="w-4 h-4" />, badge: 'Graph' },
    { id: 'household', label: 'Household', icon: <Home className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'Bills Radar', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'sandbox', label: 'Sandbox', icon: <Sparkles className="w-4 h-4" />, badge: 'Live' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <span className="text-white font-black text-lg tracking-wider">Ω</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-base">OmniBudget</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Core 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Multi-Ledger Financial Engine</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Quick Capture, Privacy Shield, Currency */}
        <div className="flex items-center gap-2.5">
          {/* Quick Capture Ctrl+K */}
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition shadow-sm"
            title="Press Ctrl+K to quick capture"
          >
            <Command className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Quick Capture</span>
            <kbd className="hidden lg:inline text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Privacy Shield Toggle */}
          <button
            onClick={togglePrivacyMode}
            className={`p-2 rounded-lg border text-xs font-medium transition ${
              isPrivacyMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 ring-1 ring-amber-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Privacy Shield (Shift+H to blur amounts)"
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Multi-Currency Dropdown */}
          <div className="relative group">
            <select
              value={currentCurrency.code}
              onChange={(e) => setCurrency(e.target.value)}
              className="appearance-none bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code} className="bg-slate-900 text-slate-200">
                  {curr.symbol} {curr.code}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Mobile subnav */}
      <div className="flex md:hidden overflow-x-auto gap-1 mt-2.5 pb-1 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap ${
              currentTab === item.id
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
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
