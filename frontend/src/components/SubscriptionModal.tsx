import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  Trash2,
  Calendar,
  Clock,
  Repeat,
  Building2,
  Tag,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Subscription, Account, CreateSubscriptionPayload, UpdateSubscriptionPayload } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  subscriptionToEdit?: Subscription | null;
  initialDate?: string;
  onSuccess: () => void;
}

const CADENCES = [
  { id: 'MONTHLY', label: 'Monthly' },
  { id: 'YEARLY', label: 'Annual' },
  { id: 'WEEKLY', label: 'Weekly' },
  { id: 'QUARTERLY', label: 'Quarterly' },
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  subscriptionToEdit,
  initialDate,
  onSuccess,
}) => {
  const { currentCurrency, formatAmount } = useCurrency();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cadence, setCadence] = useState('MONTHLY');
  const [category, setCategory] = useState('Subscriptions');
  const [nextBillingDate, setNextBillingDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditing = Boolean(subscriptionToEdit);

  useEffect(() => {
    if (subscriptionToEdit) {
      setName(subscriptionToEdit.name);
      setAmount(subscriptionToEdit.amount.toString());
      setCadence(subscriptionToEdit.cadence || 'MONTHLY');
      setCategory(subscriptionToEdit.category || 'Subscriptions');
      setNextBillingDate(subscriptionToEdit.nextBillingDate || new Date().toISOString().split('T')[0]);
      setAccountId(subscriptionToEdit.accountId || accounts[0]?.id || '');
    } else {
      setName('');
      setAmount('');
      setCadence('MONTHLY');
      setCategory('Subscriptions');
      setNextBillingDate(initialDate || new Date().toISOString().split('T')[0]);
      setAccountId(accounts[0]?.id || '');
    }
    setError('');
    setConfirmDelete(false);
  }, [subscriptionToEdit, accounts, isOpen, initialDate]);

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

  // Calculate days remaining until next billing
  const getDaysUntilBilling = () => {
    if (!nextBillingDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextBillingDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysUntil = getDaysUntilBilling();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) {
      setError('Please provide a name and recurring amount.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid billing amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const selectedAccount = accounts.find((a) => a.id === accountId);

      if (isEditing && subscriptionToEdit) {
        const updatePayload: UpdateSubscriptionPayload = {
          name: name.trim(),
          amount: parsedAmount,
          cadence,
          category,
          nextBillingDate,
          accountId: accountId || undefined,
          accountName: selectedAccount?.name,
        };
        await api.updateSubscription(subscriptionToEdit.id, updatePayload);
      } else {
        const createPayload: CreateSubscriptionPayload = {
          name: name.trim(),
          amount: parsedAmount,
          cadence,
          category,
          nextBillingDate,
          accountId: accountId || undefined,
          accountName: selectedAccount?.name,
        };
        await api.createSubscription(createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!subscriptionToEdit) return;
    try {
      setIsSubmitting(true);
      await api.deleteSubscription(subscriptionToEdit.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-luxury overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card-luxury w-full max-w-lg shadow-2xl overflow-hidden ambient-accent my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--fg)] tracking-tight">
                {isEditing ? 'Edit Recurring Commitment' : 'Add Recurring Bill or Subscription'}
              </h3>
              <p className="text-[11px] text-[var(--fg-muted)]">Track automated outlays, due dates, and radar alerts</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cadence Pills */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
              Billing Frequency
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[var(--surface-2)]/80 rounded-2xl border border-[var(--border)]">
              {CADENCES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCadence(c.id)}
                  className={`py-1.5 rounded-xl font-semibold text-xs text-center transition-all ${
                    cadence === c.id
                      ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5">Service / Provider</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Netflix, Spotify, Gym, Rent, AWS..."
                required
                autoFocus
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Subscriptions, Utilities, Insurance..."
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
              />
            </div>
          </div>

          {/* HERO AMOUNT STAGE */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                Recurring Amount
              </label>
              <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                {cadence.toLowerCase()} charge
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-500 tabular-nums">{currentCurrency.symbol}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-transparent text-2xl font-extrabold text-[var(--fg)] tracking-tight focus:outline-none tabular-nums"
              />
            </div>
          </div>

          {/* NEXT BILLING DATE & DAYS BADGE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                  <span>Next Renewal Date</span>
                </span>
                {daysUntil !== null && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      daysUntil <= 3
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        : daysUntil <= 7
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'bg-[var(--surface-2)] text-[var(--fg-muted)]'
                    }`}
                  >
                    {daysUntil === 0 ? 'Due today' : daysUntil < 0 ? 'Overdue' : `In ${daysUntil} days`}
                  </span>
                )}
              </label>
              <input
                type="date"
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                required
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                  <span>Auto-Debited Account</span>
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
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* INLINE DELETE CONFIRMATION BANNER */}
          {confirmDelete && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Confirm Subscription Cancellation</span>
              </div>
              <p className="text-[11px] text-rose-300/80">
                Are you sure you want to remove <strong>{subscriptionToEdit?.name}</strong> from your recurring radar?
                Upcoming renewal alerts will be silenced.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Remove Commitment'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--fg)] text-xs font-medium hover:bg-[var(--surface-3)] transition"
                >
                  Cancel
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
                <span>Cancel Service</span>
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] transition shadow-lg disabled:opacity-40 active:scale-95"
              >
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Track Subscription'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
