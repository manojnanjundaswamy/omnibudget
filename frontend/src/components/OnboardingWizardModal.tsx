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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#242424] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Step Indicator Header */}
        <div className="px-6 py-5 border-b border-[#242424] bg-[#171717]/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-neutral-800 text-xs font-semibold text-[#f5f5f4] flex items-center justify-center">
                {step}/3
              </span>
              <span className="text-xs font-medium text-[#9e9e98] uppercase tracking-wider">
                {step === 1 && 'Step 1: Financial Currency'}
                {step === 2 && 'Step 2: Add Starting Account'}
                {step === 3 && 'Step 3: Tailored Budget Envelopes'}
              </span>
            </div>
            <span className="text-[11px] text-[#737373]">{currentUser?.email}</span>
          </div>

          <div className="w-full bg-[#202020] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#f5f5f4] h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#f5f5f4]">Select Your Primary Currency</h3>
                <p className="text-xs text-[#9e9e98] mt-1">
                  All accounts, envelopes, and dashboard summaries will format using this base currency.
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
                          ? 'border-[#f5f5f4] bg-[#1c1c1c] text-[#f5f5f4]'
                          : 'border-[#262626] bg-[#151515] text-[#9e9e98] hover:border-[#383838]'
                      }`}
                    >
                      <div>
                        <span className="text-lg font-bold block">{c.symbol}</span>
                        <span className="text-xs font-medium block text-[#f5f5f4] mt-0.5">{c.code}</span>
                        <span className="text-[10px] text-[#737373] block">{c.name}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#f5f5f4]">Add Your First Bank Account</h3>
                <p className="text-xs text-[#9e9e98] mt-1">
                  Start with your primary checking or savings balance. You can add more anytime later.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#9e9e98] mb-1 font-medium">Account Nickname</label>
                  <input
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder="e.g. Everyday Checking"
                    className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#9e9e98] mb-1 font-medium">Bank / Institution</label>
                    <input
                      type="text"
                      value={accInstitution}
                      onChange={(e) => setAccInstitution(e.target.value)}
                      placeholder="e.g. Chase / HDFC / Revolut"
                      className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9e9e98] mb-1 font-medium">Account Type</label>
                    <select
                      value={accType}
                      onChange={(e) => setAccType(e.target.value as AccountType)}
                      className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
                    >
                      <option value="CHECKING">Checking Account</option>
                      <option value="SAVINGS">Savings Account</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="CASH_WALLET">Cash Wallet</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#9e9e98] mb-1 font-medium">Current Starting Balance</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={accBalance}
                      onChange={(e) => setAccBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] font-semibold focus:outline-none focus:border-neutral-500 tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#f5f5f4]">Set Up Your Budget Envelopes</h3>
                <p className="text-xs text-[#9e9e98] mt-1">
                  OmniBudget uses zero-based envelopes. Select and adjust your starting monthly allowances:
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {envelopes.map((env, idx) => (
                  <div
                    key={env.name}
                    className="p-3 rounded-xl bg-[#171717] border border-[#242424] flex items-center justify-between gap-3"
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
                        className="rounded border-[#333] text-white focus:ring-0"
                      />
                      <div>
                        <span className="font-medium text-[#f5f5f4] block">{env.name}</span>
                        <span className="text-[10px] text-[#737373] block">{env.group}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 w-32">
                      <span className="text-xs text-[#9e9e98]">{selectedCurrency}</span>
                      <input
                        type="number"
                        value={env.budget}
                        onChange={(e) => {
                          const updated = [...envelopes];
                          updated[idx].budget = e.target.value;
                          setEnvelopes(updated);
                        }}
                        className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded px-2 py-1 text-right text-xs text-[#f5f5f4] font-medium focus:outline-none focus:border-neutral-500 tabular-nums"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-[#242424] bg-[#171717]/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#9e9e98] hover:text-[#f5f5f4] transition"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#f5f5f4] hover:bg-white text-[#0a0a0a] transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-[#f5f5f4] hover:bg-white text-[#0a0a0a] transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Configuring Tenant...' : 'Launch Workspace'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
