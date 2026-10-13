import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Trash2, Building2 } from 'lucide-react';
import { Account, AccountType, CreateAccountPayload, UpdateAccountPayload } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
  onSuccess: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
  onSuccess,
}) => {
  const { currentCurrency } = useCurrency();
  const [name, setName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(accountToEdit);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setInstitutionName(accountToEdit.institutionName || '');
      setType(accountToEdit.type);
      setBalance(accountToEdit.balance.toString());
      setCreditLimit(accountToEdit.creditLimit ? accountToEdit.creditLimit.toString() : '');
    } else {
      setName('');
      setInstitutionName('');
      setType('CHECKING');
      setBalance('0.00');
      setCreditLimit('');
    }
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an account name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditing && accountToEdit) {
        const updatePayload: UpdateAccountPayload = {
          name,
          institutionName,
          type,
          balance: parseFloat(balance) || 0,
          creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        };
        await api.updateAccount(accountToEdit.id, updatePayload);
      } else {
        const createPayload: CreateAccountPayload = {
          name,
          institutionName,
          type,
          balance: parseFloat(balance) || 0,
          currency: currentCurrency.code,
          creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        };
        await api.createAccount(createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToEdit) return;
    if (!confirm(`Are you sure you want to delete ${accountToEdit.name}?`)) return;
    try {
      setIsSubmitting(true);
      await api.deleteAccount(accountToEdit.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--fg)] text-sm">
                {isEditing ? 'Edit Account' : 'Add Account'}
              </h3>
              <p className="text-xs text-[var(--fg-muted)]">Bank accounts, credit cards, and cash</p>
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
            <label className="block text-[var(--fg-muted)] mb-1 font-medium">Account Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Checking, Credit Card"
              required
              autoFocus
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--fg-muted)] mb-1 font-medium">Bank / Institution</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Chase, Amex, Bank..."
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-[var(--fg-muted)] mb-1 font-medium">Account Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="CHECKING">Checking Account</option>
                <option value="SAVINGS">Savings Account</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="INVESTMENT">Investment Account</option>
                <option value="CASH_WALLET">Cash Wallet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--fg-muted)] mb-1 font-medium">
                {type === 'CREDIT_CARD' ? 'Current Balance / Due' : 'Current Balance'}
              </label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] font-semibold focus:outline-none focus:border-[var(--accent)] tabular-nums"
              />
            </div>

            {type === 'CREDIT_CARD' && (
              <div>
                <label className="block text-[var(--fg-muted)] mb-1 font-medium">Credit Limit</label>
                <input
                  type="number"
                  step="0.01"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="5000.00"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)] tabular-nums"
                />
              </div>
            )}
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
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
