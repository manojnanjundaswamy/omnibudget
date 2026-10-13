import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Globe,
  CreditCard,
  Database,
  EyeOff,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useTheme, ACCENT_PRESETS, ThemeMode, RadiusType } from '../context/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface SettingsViewProps {
  onOpenSmartIngest?: () => void;
  onRefreshAll?: () => void;
  onNavigateToPlans?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenSmartIngest,
  onRefreshAll,
  onNavigateToPlans,
}) => {
  const { mode, setMode, accent, setAccent, radius, setRadius } = useTheme();
  const { currentCurrency, setCurrency, isPrivacyMode, togglePrivacyMode, formatAmount } = useCurrency();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'appearance' | 'regional' | 'billing' | 'data'>('appearance');
  const [isResetting, setIsResetting] = useState(false);
  const [customHex, setCustomHex] = useState(accent || '');

  const handleResetSandbox = async () => {
    if (!confirm('Reset ledger and restore realistic seed data?')) return;
    try {
      setIsResetting(true);
      await api.resetSandbox();
      if (onRefreshAll) await onRefreshAll();
      alert('Data reset successfully to clean realistic demo state.');
    } catch (e) {
      console.error(e);
      alert('Failed to reset data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border)]">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--fg)]">Settings</h2>
        <p className="text-xs text-[var(--fg-muted)] mt-1">
          Personalize your workspace, currency, theme, and data preferences.
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTab === 'appearance'
                ? 'bg-[var(--fg)] text-[var(--bg)] shadow-sm'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Appearance & Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('regional')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTab === 'regional'
                ? 'bg-[var(--fg)] text-[var(--bg)] shadow-sm'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Currency & Privacy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTab === 'billing'
                ? 'bg-[var(--fg)] text-[var(--bg)] shadow-sm'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Plan & Subscription
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTab === 'data'
                ? 'bg-[var(--fg)] text-[var(--bg)] shadow-sm'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Data & Backup
          </button>
        </div>
      </div>

      {/* Tab 1: Appearance */}
      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
          <div className="space-y-8">
            {/* Mode selection */}
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--fg)]">Theme Mode</h3>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                  Pick light, dark, or sync automatically with your device.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                    mode === 'light'
                      ? 'border-[var(--fg)] bg-[var(--surface-2)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--fg-muted)]'
                  }`}
                >
                  <Sun className="w-4 h-4 text-[var(--fg)]" />
                  <span className="text-xs font-medium text-[var(--fg)]">Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                    mode === 'dark'
                      ? 'border-[var(--fg)] bg-[var(--surface-2)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--fg-muted)]'
                  }`}
                >
                  <Moon className="w-4 h-4 text-[var(--fg)]" />
                  <span className="text-xs font-medium text-[var(--fg)]">Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('system')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                    mode === 'system'
                      ? 'border-[var(--fg)] bg-[var(--surface-2)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--fg-muted)]'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-[var(--fg)]" />
                  <span className="text-xs font-medium text-[var(--fg)]">Device</span>
                </button>
              </div>
            </section>

            {/* Accent Color */}
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--fg)]">Accent Color</h3>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                  Used for active highlights, key action buttons, and progress indicators.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {ACCENT_PRESETS.map((preset) => {
                  const isSelected = accent === preset.value;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setAccent(preset.value);
                        setCustomHex(preset.value || '');
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-transform hover:scale-110 ${
                        isSelected
                          ? 'ring-2 ring-[var(--fg)] ring-offset-2 ring-offset-[var(--bg)]'
                          : 'border-[var(--border)]'
                      }`}
                      style={{
                        backgroundColor: preset.previewColor,
                      }}
                      title={preset.name}
                    >
                      {isSelected && (
                        <Check className="w-4 h-4 text-white drop-shadow-sm" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="#4f46e5"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      setAccent(e.target.value);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--fg)] font-mono w-28 focus:outline-none focus:border-[var(--fg)]"
                />
                <span className="text-[11px] text-[var(--fg-muted)]">Custom Hex Code</span>
              </div>
            </section>

            {/* Corner Radius */}
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--fg)]">Corner Shape</h3>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                  Adjust the curvature of cards, buttons, and dialogs.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md">
                {(['sharp', 'soft', 'round'] as RadiusType[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadius(r)}
                    className={`p-3 rounded-2xl border text-center transition capitalize text-xs font-medium ${
                      radius === r
                        ? 'border-[var(--fg)] bg-[var(--surface-2)] text-[var(--fg)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Right Live Preview Box */}
          <div className="space-y-3">
            <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider block">
              Live Preview
            </span>
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[var(--fg-muted)] block">Grocery Budget</span>
                  <span className="text-base font-bold text-[var(--fg)] tabular">$450.00</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  On Track
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: '65%',
                    backgroundColor: accent || 'var(--fg)',
                  }}
                />
              </div>

              <button
                type="button"
                className="w-full py-2 rounded-xl text-xs font-semibold text-white transition active:scale-[0.98]"
                style={{
                  backgroundColor: accent || 'var(--fg)',
                  color: accent ? '#ffffff' : 'var(--bg)',
                }}
              >
                Sample Button
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Regional & Privacy */}
      {activeTab === 'regional' && (
        <div className="space-y-6 max-w-2xl">
          <section className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-[var(--fg-muted)] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--fg)]">Display Currency</h3>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                  Select your primary currency. All ledger amounts and budgets format accordingly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => {
                const isSelected = currentCurrency.code === curr.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => setCurrency(curr.code)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-[var(--fg)] bg-[var(--surface-2)]'
                        : 'border-[var(--border)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--fg)] block">{curr.code} ({curr.symbol})</span>
                      <span className="text-[11px] text-[var(--fg-muted)]">{curr.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[var(--fg)]" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <EyeOff className="w-5 h-5 text-[var(--fg-muted)] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--fg)]">Privacy Blur Mode</h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    Hides account balances and transaction numbers in public spaces. Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[10px]">Shift + H</kbd> anytime to toggle.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={togglePrivacyMode}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isPrivacyMode
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--border)]'
                }`}
              >
                {isPrivacyMode ? 'Active (Blurred)' : 'Off (Visible)'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Tab 3: Plan & Subscription */}
      {activeTab === 'billing' && (
        <div className="space-y-6 max-w-2xl">
          <section className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] text-[var(--fg-muted)] uppercase tracking-wider block">Current Plan</span>
                <h3 className="text-xl font-bold text-[var(--fg)] mt-0.5">
                  {currentUser?.plan || 'PRO'} Membership
                </h3>
                <p className="text-xs text-[var(--fg-muted)] mt-1">
                  Full access to unlimited accounts, monthly budgets, and automated categorization.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active
              </span>
            </div>

            {onNavigateToPlans && (
              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-xs text-[var(--fg-muted)]">Looking to change plans?</span>
                <button
                  type="button"
                  onClick={onNavigateToPlans}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fg)] hover:underline"
                >
                  <span>View All Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab 4: Data & Backup */}
      {activeTab === 'data' && (
        <div className="space-y-6 max-w-2xl">
          <section className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-[var(--fg-muted)] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--fg)]">Import Transactions</h3>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                  Import statements, Open Banking files (.OFX / .QFX), or quick SMS notifications without manual typing.
                </p>
              </div>
            </div>

            {onOpenSmartIngest && (
              <button
                type="button"
                onClick={onOpenSmartIngest}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Import Hub</span>
              </button>
            )}
          </section>

          <section className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-rose-500">Reset Demo Data</h3>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                Restores the local database to clean, realistic starter data for checking all features.
              </p>
            </div>

            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetSandbox}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition disabled:opacity-50"
            >
              {isResetting ? 'Restoring seed data...' : 'Reset to Clean Demo Data'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
