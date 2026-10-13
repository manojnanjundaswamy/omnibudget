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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#121212] border border-[#242424] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242424] bg-[#171717]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-200 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#f5f5f4] text-sm">
                {isEditing ? 'Edit Subscription' : 'Add Recurring Bill / Subscription'}
              </h3>
              <p className="text-xs text-[#9e9e98]">Auto-debit radar & renewal tracker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9e9e98] hover:text-[#f5f5f4] hover:bg-[#1f1f1f] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[#9e9e98] mb-1 font-medium">Service Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix, Spotify, GitHub, AWS, Gym..."
              required
              autoFocus
              className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">
                Recurring Amount ({currentCurrency.code})
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="14.99"
                required
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] font-semibold focus:outline-none focus:border-neutral-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">Cadence</label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">Next Billing Date</label>
              <input
                type="date"
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">Auto-Debit Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
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
          <div className="flex items-center justify-between pt-3 border-t border-[#242424]">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel Service</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#9e9e98] hover:text-[#f5f5f4] hover:bg-[#1a1a1a] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#f5f5f4] hover:bg-white text-[#0a0a0a] transition disabled:opacity-40"
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
