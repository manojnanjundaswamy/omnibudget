import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Building2,
  Calendar,
  Command,
} from 'lucide-react';
import { Account, BudgetEnvelope, SplitGroup } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  groups: SplitGroup[];
  onSuccess: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  accounts,
  envelopes,
  groups,
  onSuccess,
}) => {
  const { currentCurrency, formatAmount } = useCurrency();
  const [inputText, setInputText] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parsed states
  const [parsedAmount, setParsedAmount] = useState<number | null>(null);
  const [parsedMerchant, setParsedMerchant] = useState<string>('');
  const [parsedCategory, setParsedCategory] = useState<string>('Dining');
  const [parsedType, setParsedType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [parsedSplitMembers, setParsedSplitMembers] = useState<string[]>([]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Natural Language Parsing Engine
  useEffect(() => {
    if (!inputText.trim()) {
      setParsedAmount(null);
      setParsedMerchant('');
      setParsedSplitMembers([]);
      return;
    }

    const text = inputText.toLowerCase();

    // 1. Detect Income vs Expense
    let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';
    if (
      text.includes('salary') ||
      text.includes('payroll') ||
      text.includes('deposit') ||
      text.includes('income') ||
      text.includes('received')
    ) {
      type = 'INCOME';
    }
    setParsedType(type);

    // 2. Extract Amount ($45, 45.00, 45 usd, rs 4500, etc.)
    const amountRegex = /(?:\$|rs|₹|€|£)?\s*(\d+(?:[.,]\d{1,2})?)/i;
    const match = inputText.match(amountRegex);
    if (match && match[1]) {
      const cleanNum = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(cleanNum)) {
        setParsedAmount(cleanNum);
      }
    }

    // 3. Category & Merchant Heuristics
    let category = 'Dining';
    let merchant = '';

    if (
      text.includes('grocer') ||
      text.includes('whole foods') ||
      text.includes('trader joe') ||
      text.includes('supermarket')
    ) {
      category = 'Groceries';
      merchant = text.includes('whole foods')
        ? 'Whole Foods'
        : text.includes('trader joe')
        ? "Trader Joe's"
        : 'Supermarket';
    } else if (
      text.includes('coffee') ||
      text.includes('starbucks') ||
      text.includes('blue bottle') ||
      text.includes('cafe')
    ) {
      category = 'Dining';
      merchant = text.includes('blue bottle')
        ? 'Blue Bottle Coffee'
        : text.includes('starbucks')
        ? 'Starbucks'
        : 'Coffee Shop';
    } else if (
      text.includes('dinner') ||
      text.includes('lunch') ||
      text.includes('restaurant') ||
      text.includes('dishoom') ||
      text.includes('nobu')
    ) {
      category = 'Dining';
      merchant = text.includes('nobu') ? 'Nobu' : text.includes('dishoom') ? 'Dishoom' : 'Restaurant';
    } else if (
      text.includes('uber') ||
      text.includes('lyft') ||
      text.includes('taxi') ||
      text.includes('metro')
    ) {
      category = 'Transport';
      merchant = text.includes('uber') ? 'Uber' : text.includes('lyft') ? 'Lyft' : 'Transit';
    } else if (text.includes('flight') || text.includes('airline') || text.includes('hotel') || text.includes('airbnb')) {
      category = 'Travel';
      merchant = text.includes('airbnb') ? 'Airbnb' : 'Airlines / Hotel';
    } else if (
      text.includes('electricity') ||
      text.includes('internet') ||
      text.includes('water') ||
      text.includes('utility')
    ) {
      category = 'Utilities';
      merchant = 'Utility Provider';
    } else if (text.includes('rent') || text.includes('mortgage')) {
      category = 'Housing';
      merchant = 'Landlord / Mortgage';
    } else if (text.includes('salary') || text.includes('payroll')) {
      category = 'Salary';
      merchant = 'Employer Payroll';
    }

    // Fallback merchant if none matched
    if (!merchant) {
      const words = inputText.split(/\s+/).filter((w) => !w.match(/^\d/) && !w.startsWith('$'));
      if (words.length > 0) {
        merchant = words.slice(0, 2).join(' ');
      }
    }

    setParsedCategory(category);
    setParsedMerchant(merchant);

    // 4. Detect Group Expense Split ("split 3 ways with Alice and Bob", "split with Emma")
    if (text.includes('split')) {
      const members = ['You'];
      const withIndex = text.indexOf('with');
      if (withIndex !== -1) {
        const afterWith = inputText.substring(withIndex + 4);
        const nameCandidates = afterWith
          .split(/,|\band\b/)
          .map((n) => n.trim())
          .filter((n) => n.length > 0 && n.length < 20 && !n.match(/\d/));
        members.push(...nameCandidates);
      } else {
        const waysMatch = text.match(/split\s+(\d+)\s+ways?/);
        if (waysMatch && waysMatch[1]) {
          const num = parseInt(waysMatch[1], 10);
          for (let i = 1; i < num; i++) {
            members.push(`Friend ${i}`);
          }
        } else {
          members.push('Friend');
        }
      }
      setParsedSplitMembers(members);
    } else {
      setParsedSplitMembers([]);
    }
  }, [inputText]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedAmount || !selectedAccountId) return;

    try {
      setIsSubmitting(true);
      const payload: any = {
        accountId: selectedAccountId,
        amount: parsedAmount,
        type: parsedType,
        category: parsedCategory,
        merchant: parsedMerchant || 'Quick Entry',
        description: inputText,
        date: new Date().toISOString().split('T')[0],
      };

      if (selectedEnvelopeId) {
        payload.envelopeId = selectedEnvelopeId;
      }

      if (parsedSplitMembers.length > 1 && selectedGroupId) {
        payload.splitGroupId = selectedGroupId;
        payload.splitMembers = parsedSplitMembers;
      }

      await api.createTransaction(payload);
      setInputText('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const myShare =
    parsedAmount && parsedSplitMembers.length > 0
      ? parsedAmount / parsedSplitMembers.length
      : parsedAmount;

  const iouShare = parsedAmount && myShare ? parsedAmount - myShare : 0;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-luxury overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card-luxury w-full max-w-xl shadow-2xl overflow-hidden ambient-accent my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[var(--fg)] tracking-tight">AI Quick Capture</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-2)] text-[var(--fg-muted)] border border-[var(--border)] flex items-center gap-1">
                  <Command className="w-2.5 h-2.5" /> K
                </span>
              </div>
              <p className="text-[11px] text-[var(--fg-muted)]">Type naturally to auto-parse transactions or split bills</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-transparent hover:border-[var(--border)]"
            title="Press Esc to close"
          >
            <span className="text-[10px] uppercase font-mono opacity-60 tracking-wider">esc</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input area */}
        <form onSubmit={handleQuickSubmit} className="px-6 pb-6 pt-2 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
              Natural Language Command
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='e.g. "Dinner $120 at Nobu split with Alex and Jordan" or "Spent $45 on groceries"'
                autoFocus
                className="w-full input-luxury px-4 py-3 text-sm text-[var(--fg)] placeholder-[var(--fg-muted)]/60 font-medium"
              />
            </div>
          </div>

          {/* Real-time Parsed Preview Badge */}
          {parsedAmount !== null && (
            <div className="p-4 rounded-2xl bg-[var(--surface-2)]/70 border border-[var(--border)] space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
                <span className="font-bold text-[var(--fg)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Real-Time Parser Interpretation</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] uppercase tracking-wider">
                  {parsedType}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
                  <span className="text-[var(--fg-muted)] text-[10px] block font-medium">Total Outlay</span>
                  <span className="font-extrabold text-[var(--fg)] text-sm tabular-nums">
                    {formatAmount(parsedAmount)}
                  </span>
                </div>
                <div className="bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
                  <span className="text-[var(--fg-muted)] text-[10px] block font-medium">Merchant</span>
                  <span className="font-bold text-[var(--fg)] truncate block">
                    {parsedMerchant || 'Unspecified'}
                  </span>
                </div>
                <div className="bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
                  <span className="text-[var(--fg-muted)] text-[10px] block font-medium">Category</span>
                  <span className="font-bold text-[var(--fg)] block">{parsedCategory}</span>
                </div>
                <div className="bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
                  <span className="text-[var(--fg-muted)] text-[10px] block font-medium">Your Share</span>
                  <span className="font-extrabold text-emerald-500 text-sm tabular-nums">
                    {formatAmount(myShare || 0)}
                  </span>
                </div>
              </div>

              {/* Split Invariant Highlight */}
              {parsedSplitMembers.length > 1 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Users className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Split Debt Invariant Active:</span>
                    <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                      Your ledger personal spend is <strong>{formatAmount(myShare || 0)}</strong>. The remaining{' '}
                      <strong>{formatAmount(iouShare)}</strong> is automatically registered as a peer receivable owed by{' '}
                      {parsedSplitMembers.filter((m) => m !== 'You').join(', ')}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account & Category Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                <span>Paying Account</span>
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatAmount(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                <span>Budget Envelope</span>
              </label>
              <select
                value={selectedEnvelopeId}
                onChange={(e) => setSelectedEnvelopeId(e.target.value)}
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium cursor-pointer"
              >
                <option value="">No envelope (Unbudgeted)</option>
                {envelopes.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({formatAmount(env.monthlyBudget - env.spentAmount)} remaining)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <span className="text-[11px] text-[var(--fg-muted)] hidden sm:inline">
              Press Enter to log instantly
            </span>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-transparent hover:border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!parsedAmount || !selectedAccountId || isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg active:scale-95"
              >
                <span>{isSubmitting ? 'Recording...' : 'Save Transaction'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
