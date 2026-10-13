import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Trash2, Calendar, Clock } from 'lucide-react';
import { Subscription, Account, CreateSubscriptionPayload, UpdateSubscriptionPayload } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  subscriptionToEdit?: Subscription | null;
  onSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  subscriptionToEdit,
  onSuccess,
}) => {
  const { currentCurrency } = useCurrency();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cadence, setCadence] = useState('MONTHLY');
  const [category, setCategory] = useState('Subscriptions');
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      setNextBillingDate(new Date().toISOString().split('T')[0]);
      setAccountId(accounts[0]?.id || '');
    }
  }, [subscriptionToEdit, accounts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) {
      setError('Please provide a name and recurring amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const selectedAccount = accounts.find((a) => a.id === accountId);

      if (isEditing && subscriptionToEdit) {
        const updatePayload: UpdateSubscriptionPayload = {
          name,
          amount: parseFloat(amount) || 0,
          cadence,
          category,
          nextBillingDate,
          accountId: accountId || undefined,
          accountName: selectedAccount?.name,
        };
        await api.updateSubscription(subscriptionToEdit.id, updatePayload);
      } else {
        const createPayload: CreateSubscriptionPayload = {
          name,
          amount: parseFloat(amount) || 0,
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
    if (!confirm(`Are you sure you want to cancel subscription ${subscriptionToEdit.name}?`)) return;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-backdrop">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden modal-content">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--fg)] text-sm">
                {isEditing ? 'Edit Bill / Subscription' : 'Add Recurring Bill'}
              </h3>
              <p className="text-xs text-[var(--fg-muted)]">Track renewal dates and monthly expenses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[var(--fg-muted)] mb-1 font-medium">Service or Bill Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix, Spotify, Internet, Rent..."
              required
              autoFocus
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--fg-muted)] mb-1 font-medium">
                Recurring Amount ({currentCurrency.code})
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="14.99"
                required
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] font-semibold focus:outline-none focus:border-[var(--accent)] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[var(--fg-muted)] mb-1 font-medium">Cadence</label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--fg-muted)] mb-1 font-medium">Next Billing Date</label>
              <input
                type="date"
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-[var(--fg-muted)] mb-1 font-medium">Payment Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="">None (Unspecified)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] transition disabled:opacity-40 shadow-sm"
              >
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Track Bill'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
