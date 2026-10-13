import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  PieChart,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { AccountType, EnvelopeGroup, OnboardingPayload } from '../types';

export const OnboardingWizardModal: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { isOnboardingOpen, completeOnboarding, currentUser } = useAuth();
  const { setCurrency } = useCurrency();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Currency
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Step 2: First Account
  const [accName, setAccName] = useState('Primary Checking');
  const [accInstitution, setAccInstitution] = useState('Main Bank');
  const [accType, setAccType] = useState<AccountType>('CHECKING');
  const [accBalance, setAccBalance] = useState('3500.00');

  // Step 3: Starting Envelopes
  const [envelopes, setEnvelopes] = useState([
    { name: 'Rent & Housing', group: 'NEEDS' as EnvelopeGroup, budget: '1500', selected: true },
    { name: 'Groceries & Household', group: 'NEEDS' as EnvelopeGroup, budget: '500', selected: true },
    { name: 'Utilities & Internet', group: 'NEEDS' as EnvelopeGroup, budget: '200', selected: true },
    { name: 'Dining Out & Cafes', group: 'WANTS' as EnvelopeGroup, budget: '350', selected: true },
    { name: 'Shopping & Leisure', group: 'WANTS' as EnvelopeGroup, budget: '250', selected: true },
    { name: 'Emergency Vault', group: 'SAVINGS_AND_DEBT' as EnvelopeGroup, budget: '500', selected: true },
  ]);

  if (!isOnboardingOpen) return null;

  const currencyOptions = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  const handleNext = () => {
    if (step === 1) {
      setCurrency(selectedCurrency);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      const selectedEnvs = envelopes
        .filter((e) => e.selected)
        .map((e) => ({
          name: e.name,
          groupType: e.group,
          monthlyBudget: parseFloat(e.budget) || 0,
        }));

      const payload: OnboardingPayload = {
        currency: selectedCurrency,
        initialAccount: {
          name: accName || 'Primary Checking',
          institutionName: accInstitution || 'Main Bank',
          type: accType,
          balance: parseFloat(accBalance) || 0,
        },
        initialEnvelopes: selectedEnvs,
      };

      await completeOnboarding(payload);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md modal-backdrop">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] modal-content">
        {/* Step Indicator Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--fg)] flex items-center justify-center">
                {step}/3
              </span>
              <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                {step === 1 && 'Step 1: Choose Currency'}
                {step === 2 && 'Step 2: Add Starting Account'}
                {step === 3 && 'Step 3: Budget Categories'}
              </span>
            </div>
            <span className="text-[11px] text-[var(--fg-muted)]">{currentUser?.email}</span>
          </div>

          <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className="bg-[var(--fg)] h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--fg)]">Select Your Primary Currency</h3>
                <p className="text-xs text-[var(--fg-muted)] mt-1">
                  All accounts, categories, and summaries will format using this base currency.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currencyOptions.map((c) => {
                  const isSelected = selectedCurrency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--fg)] font-semibold shadow-sm'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div>
                        <span className="text-lg font-bold block">{c.symbol}</span>
                        <span className="text-xs font-medium block text-[var(--fg)] mt-0.5">{c.code}</span>
                        <span className="text-[10px] text-[var(--fg-muted)] block">{c.name}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--fg)]">Add Your First Bank Account</h3>
                <p className="text-xs text-[var(--fg-muted)] mt-1">
                  Start with your primary checking or savings balance. You can add more anytime later.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--fg-muted)] mb-1 font-medium">Account Nickname</label>
                  <input
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder="e.g. Everyday Checking"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--fg-muted)] mb-1 font-medium">Bank / Institution</label>
                    <input
                      type="text"
                      value={accInstitution}
                      onChange={(e) => setAccInstitution(e.target.value)}
                      placeholder="e.g. Chase / HDFC / Revolut"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--fg-muted)] mb-1 font-medium">Account Type</label>
                    <select
                      value={accType}
                      onChange={(e) => setAccType(e.target.value as AccountType)}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="CHECKING">Checking Account</option>
                      <option value="SAVINGS">Savings Account</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="CASH_WALLET">Cash Wallet</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--fg-muted)] mb-1 font-medium">Current Starting Balance</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={accBalance}
                      onChange={(e) => setAccBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] font-semibold focus:outline-none focus:border-[var(--accent)] tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--fg)]">Set Up Your Budget Categories</h3>
                <p className="text-xs text-[var(--fg-muted)] mt-1">
                  Choose starting spending targets for your key categories. You can adjust these anytime:
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {envelopes.map((env, idx) => (
                  <div
                    key={env.name}
                    className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={env.selected}
                        onChange={(e) => {
                          const updated = [...envelopes];
                          updated[idx].selected = e.target.checked;
                          setEnvelopes(updated);
                        }}
                        className="rounded border-[var(--border)] text-[var(--fg)] focus:ring-0"
                      />
                      <div>
                        <span className="font-medium text-[var(--fg)] block">{env.name}</span>
                        <span className="text-[10px] text-[var(--fg-muted)] block">{env.group}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 w-32">
                      <span className="text-xs text-[var(--fg-muted)]">{selectedCurrency}</span>
                      <input
                        type="number"
                        value={env.budget}
                        onChange={(e) => {
                          const updated = [...envelopes];
                          updated[idx].budget = e.target.value;
                          setEnvelopes(updated);
                        }}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-right text-xs text-[var(--fg)] font-medium focus:outline-none focus:border-[var(--accent)] tabular-nums"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Setting Up...' : 'Get Started'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
