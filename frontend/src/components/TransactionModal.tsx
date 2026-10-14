import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowRight,
  Trash2,
  Calendar,
  Building2,
  Tag,
  FileText,
  Store,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  AlertTriangle,
  Sparkles,
  Check,
  Plus,
} from 'lucide-react';
import {
  Transaction,
  Account,
  BudgetEnvelope,
  TransactionType,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  transactionToEdit?: Transaction | null;
  initialDate?: string;
  initialType?: TransactionType;
  onSuccess: () => void;
}

const COMMON_CATEGORIES = [
  { name: 'Dining', emoji: '🍽️', type: 'EXPENSE' },
  { name: 'Groceries', emoji: '🛒', type: 'EXPENSE' },
  { name: 'Shopping', emoji: '🛍️', type: 'EXPENSE' },
  { name: 'Housing', emoji: '🏠', type: 'EXPENSE' },
  { name: 'Transport', emoji: '🚗', type: 'EXPENSE' },
  { name: 'Entertainment', emoji: '🎬', type: 'EXPENSE' },
  { name: 'Bills & Utilities', emoji: '⚡', type: 'EXPENSE' },
  { name: 'Health', emoji: '💊', type: 'EXPENSE' },
  { name: 'Salary', emoji: '💼', type: 'INCOME' },
  { name: 'Freelance', emoji: '💻', type: 'INCOME' },
  { name: 'Investment', emoji: '📈', type: 'INCOME' },
  { name: 'Transfer', emoji: '🔄', type: 'TRANSFER' },
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  envelopes,
  transactionToEdit,
  initialDate,
  initialType,
  onSuccess,
}) => {
  const { currentCurrency, formatAmount } = useCurrency();
  const [type, setType] = useState<TransactionType>(initialType || 'EXPENSE');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Dining');
  const [accountId, setAccountId] = useState('');
  const [envelopeId, setEnvelopeId] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(transactionToEdit);

  // Sync state on open/edit
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'EXPENSE');
      setAmount(Math.abs(transactionToEdit.grossAmount || transactionToEdit.amount).toString());
      setMerchant(transactionToEdit.merchant || '');
      setDescription(transactionToEdit.description || '');
      setCategory(transactionToEdit.category || 'General');
      setAccountId(transactionToEdit.accountId || accounts[0]?.id || '');
      setEnvelopeId(transactionToEdit.envelopeId || '');
      setDate(transactionToEdit.date || new Date().toISOString().split('T')[0]);
    } else {
      setType(initialType || 'EXPENSE');
      setAmount('');
      setMerchant('');
      setDescription('');
      setCategory(initialType === 'INCOME' ? 'Salary' : 'Dining');
      setAccountId(accounts[0]?.id || '');
      setEnvelopeId('');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
    }
    setError('');
    setConfirmDelete(false);

    if (isOpen) {
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 50);
    }
  }, [transactionToEdit, accounts, isOpen]);

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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddPreset = (value: number) => {
    const current = parseFloat(amount) || 0;
    const updated = (current + value).toFixed(2);
    setAmount(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!accountId) {
      setError('Please select an account for this transaction.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditing && transactionToEdit) {
        const updatePayload: UpdateTransactionPayload = {
          accountId,
          amount: parsedAmount,
          type,
          category,
          envelopeId: envelopeId || undefined,
          merchant: merchant.trim() || 'Transaction',
          description: description.trim(),
          date,
        };
        await api.updateTransaction(transactionToEdit.id, updatePayload);
      } else {
        const createPayload: CreateTransactionPayload = {
          accountId,
          amount: parsedAmount,
          type,
          category,
          envelopeId: envelopeId || undefined,
          merchant: merchant.trim() || 'Transaction',
          description: description.trim(),
          date,
        };
        await api.createTransaction(createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionToEdit) return;
    try {
      setIsSubmitting(true);
      await api.deleteTransaction(transactionToEdit.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ambientClass =
    type === 'INCOME' || type === 'SETTLEMENT'
      ? 'ambient-income'
      : type === 'TRANSFER' || type === 'GROUP_SPLIT_PAYMENT'
      ? 'ambient-transfer'
      : 'ambient-expense';

  const TYPE_THEMES: Record<
    TransactionType,
    {
      color: string;
      activeTab: string;
      amountGlow: string;
      submitBg: string;
      badge: string;
    }
  > = {
    EXPENSE: {
      color: 'text-rose-500',
      activeTab: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-sm',
      amountGlow: 'focus-within:border-rose-500/50 focus-within:shadow-[0_0_20px_-3px_rgba(244,63,94,0.25)]',
      submitBg: 'bg-rose-500 hover:bg-rose-600 text-white',
      badge: 'Expense',
    },
    INCOME: {
      color: 'text-emerald-500',
      activeTab: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm',
      amountGlow: 'focus-within:border-emerald-500/50 focus-within:shadow-[0_0_20px_-3px_rgba(16,185,129,0.25)]',
      submitBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badge: 'Income',
    },
    TRANSFER: {
      color: 'text-indigo-500',
      activeTab: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-sm',
      amountGlow: 'focus-within:border-indigo-500/50 focus-within:shadow-[0_0_20px_-3px_rgba(99,102,241,0.25)]',
      submitBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      badge: 'Transfer',
    },
    GROUP_SPLIT_PAYMENT: {
      color: 'text-indigo-500',
      activeTab: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-sm',
      amountGlow: 'focus-within:border-indigo-500/50 focus-within:shadow-[0_0_20px_-3px_rgba(99,102,241,0.25)]',
      submitBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      badge: 'Split Payment',
    },
    SETTLEMENT: {
      color: 'text-emerald-500',
      activeTab: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm',
      amountGlow: 'focus-within:border-emerald-500/50 focus-within:shadow-[0_0_20px_-3px_rgba(16,185,129,0.25)]',
      submitBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badge: 'Settlement',
    },
  };

  const typeTheme = TYPE_THEMES[type] || TYPE_THEMES.EXPENSE;

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-luxury overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`modal-card-luxury w-full max-w-xl shadow-2xl overflow-hidden my-auto ${ambientClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${typeTheme.activeTab}`}>
              {type === 'INCOME' ? (
                <ArrowDownLeft className="w-4 h-4" />
              ) : type === 'TRANSFER' ? (
                <ArrowRightLeft className="w-4 h-4" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[var(--fg)] tracking-tight">
                  {isEditing ? 'Edit Transaction' : 'Record Transaction'}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--fg-muted)] border border-[var(--border)]">
                  {typeTheme.badge}
                </span>
              </div>
              <p className="text-[11px] text-[var(--fg-muted)]">
                {isEditing ? 'Update transaction details in your ledger' : 'Instantly balances accounts and envelopes'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="group flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-transparent hover:border-[var(--border)]"
            title="Press Esc to close"
          >
            <span className="text-[10px] uppercase font-mono opacity-60 tracking-wider">esc</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Segmented Pill Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--surface-2)]/80 backdrop-blur rounded-2xl border border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                if (category === 'Salary') setCategory('Dining');
              }}
              className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                type === 'EXPENSE'
                  ? 'bg-[var(--surface)] text-rose-500 shadow-md border border-rose-500/20'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                if (category === 'Dining') setCategory('Salary');
              }}
              className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                type === 'INCOME'
                  ? 'bg-[var(--surface)] text-emerald-500 shadow-md border border-emerald-500/20'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Income</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('TRANSFER');
                setCategory('Transfer');
              }}
              className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                type === 'TRANSFER'
                  ? 'bg-[var(--surface)] text-indigo-500 shadow-md border border-indigo-500/20'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* HERO AMOUNT STAGE */}
          <div className="relative rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] p-4 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                Transaction Amount
              </label>
              <span className="text-[11px] font-mono font-medium text-[var(--fg-muted)]">
                {currentCurrency.code} • {currentCurrency.symbol}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tabular-nums ${typeTheme.color}`}>
                {type === 'INCOME' ? '+' : type === 'TRANSFER' ? '⇄' : '-'}
                {currentCurrency.symbol}
              </span>
              <input
                ref={amountInputRef}
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-transparent text-3xl sm:text-4xl font-extrabold text-[var(--fg)] tracking-tight focus:outline-none tabular-nums placeholder-[var(--fg-subtle)]/40"
              />
            </div>

            {/* Quick Add Presets */}
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--border)]/60 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--fg-muted)] shrink-0 font-medium mr-1">Quick Add:</span>
              {[10, 25, 50, 100, 250].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--surface)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg)] transition active:scale-95 shrink-0"
                >
                  +{currentCurrency.symbol}
                  {preset}
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium text-rose-400 hover:bg-rose-500/10 transition shrink-0 ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* MERCHANT & CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                <span>Payee / Merchant</span>
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder={type === 'INCOME' ? 'Employer, Client, Dividend...' : 'Uber, Starbucks, Apple, Amazon...'}
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                <span>Category</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Dining, Housing, Salary..."
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
              />
            </div>
          </div>

          {/* QUICK CATEGORY CHIPS */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider font-semibold block">
              Popular Categories
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {COMMON_CATEGORIES.filter((c) => (type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE')).map(
                (c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                      category.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-[var(--fg)] text-[var(--bg)] shadow-sm'
                        : 'bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)]'
                    }`}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.name}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* ACCOUNT & ENVELOPE SELECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                  <span>Paying Account</span>
                </span>
                {selectedAccount && (
                  <span className="text-[10px] text-[var(--fg-muted)] font-mono">
                    Bal: {formatAmount(selectedAccount.balance)}
                  </span>
                )}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type}) • {formatAmount(acc.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                <span>Budget Envelope</span>
              </label>
              <select
                value={envelopeId}
                onChange={(e) => setEnvelopeId(e.target.value)}
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium cursor-pointer"
              >
                <option value="">None (Unbudgeted Outlay)</option>
                {envelopes.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({formatAmount(env.monthlyBudget)}/mo)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DATE & NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                  <span>Date</span>
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] underline"
                  >
                    Today
                  </button>
                  <span className="text-[var(--border)]">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setDate(d.toISOString().split('T')[0]);
                    }}
                    className="text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] underline"
                  >
                    Yesterday
                  </button>
                </span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                <span>Notes & Receipt Memo</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional memo, receipt #, tax tag..."
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
              />
            </div>
          </div>

          {/* INLINE DELETE CONFIRMATION BANNER */}
          {confirmDelete && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Confirm Deletion</span>
              </div>
              <p className="text-[11px] text-rose-300/80">
                Are you sure you want to permanently delete this transaction? The corresponding account balance will be
                automatically reverted.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete Permanently'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--fg)] text-xs font-medium hover:bg-[var(--surface-3)] transition"
                >
                  Keep Transaction
                </button>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            {isEditing && !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition font-medium text-xs border border-transparent hover:border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

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
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg disabled:opacity-40 active:scale-95 ${typeTheme.submitBg}`}
              >
                <span>
                  {isSubmitting
                    ? 'Saving...'
                    : isEditing
                    ? 'Update Transaction'
                    : type === 'INCOME'
                    ? 'Record Income'
                    : type === 'TRANSFER'
                    ? 'Execute Transfer'
                    : 'Record Expense'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
