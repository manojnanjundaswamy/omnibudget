import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Trash2 } from 'lucide-react';
import { Transaction, Account, BudgetEnvelope, TransactionType, CreateTransactionPayload, UpdateTransactionPayload } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  transactionToEdit?: Transaction | null;
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  envelopes,
  transactionToEdit,
  onSuccess,
}) => {
  const { currentCurrency } = useCurrency();
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Dining');
  const [accountId, setAccountId] = useState('');
  const [envelopeId, setEnvelopeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(transactionToEdit);

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
      setType('EXPENSE');
      setAmount('');
      setMerchant('');
      setDescription('');
      setCategory('Dining');
      setAccountId(accounts[0]?.id || '');
      setEnvelopeId('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [transactionToEdit, accounts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) {
      setError('Please provide an amount and select an account.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditing && transactionToEdit) {
        const updatePayload: UpdateTransactionPayload = {
          accountId,
          amount: parseFloat(amount),
          type,
          category,
          envelopeId: envelopeId || undefined,
          merchant: merchant || 'Transaction',
          description,
          date,
        };
        await api.updateTransaction(transactionToEdit.id, updatePayload);
      } else {
        const createPayload: CreateTransactionPayload = {
          accountId,
          amount: parseFloat(amount),
          type,
          category,
          envelopeId: envelopeId || undefined,
          merchant: merchant || 'Transaction',
          description,
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
    if (!confirm('Are you sure you want to delete this transaction?')) return;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#121212] border border-[#242424] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242424] bg-[#171717]/60">
          <div>
            <h3 className="font-semibold text-[#f5f5f4] text-sm">
              {isEditing ? 'Edit Transaction' : 'Record New Transaction'}
            </h3>
            <p className="text-xs text-[#9e9e98]">Double-entry ledger entry</p>
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

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#171717] rounded-xl border border-[#262626]">
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-1.5 rounded-lg font-medium text-center transition ${
                  type === t
                    ? 'bg-[#242424] text-[#f5f5f4] shadow-sm'
                    : 'text-[#9e9e98] hover:text-[#f5f5f4]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">Amount ({currentCurrency.code})</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] font-semibold text-sm focus:outline-none focus:border-neutral-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          {/* Merchant / Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">Merchant / Payee</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Trader Joe's, Uber, Employer..."
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Dining, Groceries, Housing..."
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          {/* Account & Envelope */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">Paying Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#9e9e98] mb-1 font-medium">Budget Envelope</label>
              <select
                value={envelopeId}
                onChange={(e) => setEnvelopeId(e.target.value)}
                className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
              >
                <option value="">None (Unbudgeted)</option>
                {envelopes.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#9e9e98] mb-1 font-medium">Memo / Notes</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or context"
              className="w-full bg-[#171717] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#242424]">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition font-medium text-xs"
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
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#9e9e98] hover:text-[#f5f5f4] hover:bg-[#1a1a1a] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#f5f5f4] hover:bg-white text-[#0a0a0a] transition disabled:opacity-40"
              >
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Transaction' : 'Record Transaction'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
