import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  Trash2,
  Building2,
  Landmark,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Account, AccountType, CreateAccountPayload, UpdateAccountPayload } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
  onSuccess: () => void;
}

const ACCOUNT_TYPE_CONFIG = [
  { type: 'CHECKING' as AccountType, label: 'Checking', icon: Landmark, desc: 'Daily spending & salary' },
  { type: 'SAVINGS' as AccountType, label: 'Savings', icon: PiggyBank, desc: 'High yield & rainy day' },
  { type: 'CREDIT_CARD' as AccountType, label: 'Credit Card', icon: CreditCard, desc: 'Revolving line of credit' },
  { type: 'INVESTMENT' as AccountType, label: 'Investment', icon: TrendingUp, desc: 'Stocks, SIPs & brokerage' },
  { type: 'CASH_WALLET' as AccountType, label: 'Cash Wallet', icon: Wallet, desc: 'Physical cash & petty cash' },
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
  onSuccess,
}) => {
  const { currentCurrency, formatAmount } = useCurrency();
  const [name, setName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    setError('');
    setConfirmDelete(false);
  }, [accountToEdit, isOpen]);

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
          name: name.trim(),
          institutionName: institutionName.trim(),
          type,
          balance: parseFloat(balance) || 0,
          creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        };
        await api.updateAccount(accountToEdit.id, updatePayload);
      } else {
        const createPayload: CreateAccountPayload = {
          name: name.trim(),
          institutionName: institutionName.trim(),
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
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--fg)] tracking-tight">
                {isEditing ? 'Edit Financial Account' : 'Add Financial Account'}
              </h3>
              <p className="text-[11px] text-[var(--fg-muted)]">Bank accounts, credit lines, investments, and cash</p>
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

          {/* Account Type Selector Grid */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
              Account Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACCOUNT_TYPE_CONFIG.map((cfg) => {
                const Icon = cfg.icon;
                const isSelected = type === cfg.type;
                return (
                  <button
                    key={cfg.type}
                    type="button"
                    onClick={() => setType(cfg.type)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)] shadow-sm'
                        : 'bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-[var(--bg)]' : 'text-[var(--fg-muted)]'}`} />
                    <div>
                      <span className="font-bold text-xs block leading-tight">{cfg.label}</span>
                      <span className={`text-[10px] block opacity-70 leading-tight mt-0.5`}>{cfg.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Name & Institution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5">Account Nickname</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Primary Checking, Travel Amex"
                required
                autoFocus
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5">Institution / Bank</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Chase, Vanguard, Fidelity, Cash..."
                className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
              />
            </div>
          </div>

          {/* HERO BALANCE STAGE */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                {type === 'CREDIT_CARD' ? 'Current Outstanding Balance' : 'Current Available Balance'}
              </label>
              <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                {currentCurrency.code} • {currentCurrency.symbol}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[var(--fg-muted)] tabular-nums">{currentCurrency.symbol}</span>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-transparent text-2xl font-extrabold text-[var(--fg)] tracking-tight focus:outline-none tabular-nums"
              />
            </div>
          </div>

          {type === 'CREDIT_CARD' && (
            <div>
              <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5">Total Credit Limit</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] font-mono text-xs">
                  {currentCurrency.symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="5000.00"
                  className="w-full input-luxury pl-8 pr-3.5 py-2.5 text-xs text-[var(--fg)] font-medium tabular-nums"
                />
              </div>
            </div>
          )}

          {/* INLINE DELETE CONFIRMATION BANNER */}
          {confirmDelete && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Confirm Account Deletion</span>
              </div>
              <p className="text-[11px] text-rose-300/80">
                Are you sure you want to delete <strong>{accountToEdit?.name}</strong>? All historical transactions
                linked to this account may lose their origin link.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete Account'}
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] transition shadow-lg disabled:opacity-40 active:scale-95"
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
