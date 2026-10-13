import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Building2,
  Calendar,
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
    if (text.includes('salary') || text.includes('payroll') || text.includes('deposit') || text.includes('income') || text.includes('received')) {
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

    if (text.includes('grocer') || text.includes('whole foods') || text.includes('trader joe') || text.includes('supermarket')) {
      category = 'Groceries';
      merchant = text.includes('whole foods') ? 'Whole Foods' : text.includes('trader joe') ? "Trader Joe's" : 'Supermarket';
    } else if (text.includes('coffee') || text.includes('starbucks') || text.includes('blue bottle') || text.includes('cafe')) {
      category = 'Dining';
      merchant = text.includes('blue bottle') ? 'Blue Bottle Coffee' : text.includes('starbucks') ? 'Starbucks' : 'Coffee Shop';
    } else if (text.includes('dinner') || text.includes('lunch') || text.includes('restaurant') || text.includes('dishoom') || text.includes('nobu')) {
      category = 'Dining';
      merchant = text.includes('nobu') ? 'Nobu' : text.includes('dishoom') ? 'Dishoom' : 'Restaurant';
    } else if (text.includes('uber') || text.includes('lyft') || text.includes('taxi') || text.includes('metro')) {
      category = 'Transport';
      merchant = text.includes('uber') ? 'Uber' : text.includes('lyft') ? 'Lyft' : 'Transport';
    } else if (text.includes('rent') || text.includes('housing') || text.includes('mortgage')) {
      category = 'Housing';
      merchant = 'Landlord / Community';
    } else if (text.includes('netflix') || text.includes('spotify') || text.includes('movie')) {
      category = 'Entertainment';
      merchant = text.includes('netflix') ? 'Netflix' : text.includes('spotify') ? 'Spotify' : 'Entertainment';
    } else if (type === 'INCOME') {
      category = 'Salary';
      merchant = 'Employer / Payroll';
    }

    setParsedCategory(category);
    if (!parsedMerchant || merchant) {
      setParsedMerchant(merchant || 'Merchant');
    }

    // Auto-match envelope
    const matchedEnv = envelopes.find((e) => e.name.toLowerCase().includes(category.toLowerCase()));
    if (matchedEnv) {
      setSelectedEnvelopeId(matchedEnv.id);
    }

    // 4. Detect Group Splits ("split 3 ways", "split with liam and emma", "split with alice")
    if (text.includes('split')) {
      if (text.includes('split 3') || text.includes('3 ways')) {
        setParsedSplitMembers(['You', 'Friend 1', 'Friend 2']);
      } else if (text.includes('split 4') || text.includes('4 ways')) {
        setParsedSplitMembers(['You', 'Friend 1', 'Friend 2', 'Friend 3']);
      } else if (text.includes('split with') || text.includes('with')) {
        // extract names after "with"
        const afterWith = text.split(/with|split/)[1] || '';
        const names = afterWith
          .replace(/[0-9$,.]/g, '')
          .split(/and|,/)
          .map((n) => n.trim())
          .filter((n) => n.length > 1 && n !== 'me' && n !== 'ways');
        if (names.length > 0) {
          setParsedSplitMembers(['You', ...names.map((n) => n.charAt(0).toUpperCase() + n.slice(1))]);
        } else {
          setParsedSplitMembers(['You', 'Partner']);
        }
      } else {
        setParsedSplitMembers(['You', 'Partner']);
      }
    } else {
      setParsedSplitMembers([]);
    }
  }, [inputText, envelopes]);

  if (!isOpen) return null;

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
        envelopeId: selectedEnvelopeId || undefined,
        merchant: parsedMerchant || 'Quick Purchase',
        description: inputText || 'Quick capture entry',
        date: new Date().toISOString().split('T')[0],
      };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Smart Quick Capture</h3>
              <p className="text-xs text-slate-400">Natural language personal & split transaction ingestion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input area */}
        <form onSubmit={handleQuickSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Type naturally (e.g. "Dinner $120 at Nobu split 3 ways with Liam and Emma")
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Spent $45 on groceries at Trader Joe's..."
                autoFocus
                className="w-full bg-slate-900/90 border border-indigo-500/40 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
              />
            </div>
          </div>

          {/* Real-time Parsed Preview Badge */}
          {parsedAmount !== null && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Engine Parsed Extraction
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 uppercase">
                  {parsedType}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-slate-400 text-[11px] block">Gross Total</span>
                  <span className="font-bold text-slate-100 text-sm">
                    {formatAmount(parsedAmount)}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-slate-400 text-[11px] block">Merchant</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {parsedMerchant || 'Unspecified'}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-slate-400 text-[11px] block">Category</span>
                  <span className="font-semibold text-slate-200 block">{parsedCategory}</span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-slate-400 text-[11px] block">Personal Impact</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {formatAmount(myShare)}
                  </span>
                </div>
              </div>

              {/* Split Invariant Highlight */}
              {parsedSplitMembers.length > 1 && (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-emerald-300">Split-to-Budget Double-Entry Protected:</span>
                    <p className="text-[11px] text-emerald-400/90 mt-0.5">
                      Your budget is charged only your personal share ({formatAmount(myShare)}). The remaining{' '}
                      <strong>{formatAmount(iouShare)}</strong> is automatically booked as a Receivable IOU asset owed by{' '}
                      {parsedSplitMembers.filter((m) => m !== 'You').join(', ')}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account & Envelope Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Paying Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatAmount(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Budget Envelope
              </label>
              <select
                value={selectedEnvelopeId}
                onChange={(e) => setSelectedEnvelopeId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
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
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!parsedAmount || !selectedAccountId || isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span>{isSubmitting ? 'Recording...' : 'Ingest Transaction'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
