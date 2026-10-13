import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  Trash2,
  Tag,
  ShieldCheck,
  ShoppingBag,
  PiggyBank,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { BudgetEnvelope, EnvelopeGroup, CreateEnvelopePayload, UpdateEnvelopePayload } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface EnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelopeToEdit?: BudgetEnvelope | null;
  onSuccess: () => void;
}

const ENVELOPE_GROUPS: { group: EnvelopeGroup; label: string; ratio: string; icon: any; color: string }[] = [
  { group: 'NEEDS', label: 'Essential Needs', ratio: '50% Rule', icon: ShieldCheck, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { group: 'WANTS', label: 'Lifestyle Wants', ratio: '30% Rule', icon: ShoppingBag, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { group: 'SAVINGS_AND_DEBT', label: 'Savings & Debt', ratio: '20% Rule', icon: PiggyBank, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
];

export const EnvelopeModal: React.FC<EnvelopeModalProps> = ({
  isOpen,
  onClose,
  envelopeToEdit,
  onSuccess,
}) => {
  const { currentCurrency, formatAmount } = useCurrency();
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<EnvelopeGroup>('NEEDS');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditing = Boolean(envelopeToEdit);

  useEffect(() => {
    if (envelopeToEdit) {
      setName(envelopeToEdit.name);
      setGroupType(envelopeToEdit.groupType);
      setMonthlyBudget(envelopeToEdit.monthlyBudget.toString());
    } else {
      setName('');
      setGroupType('NEEDS');
      setMonthlyBudget('300.00');
    }
    setError('');
    setConfirmDelete(false);
  }, [envelopeToEdit, isOpen]);

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
    const current = parseFloat(monthlyBudget) || 0;
    setMonthlyBudget((current + value).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }
    const budgetVal = parseFloat(monthlyBudget);
    if (isNaN(budgetVal) || budgetVal < 0) {
      setError('Please provide a valid monthly budget limit.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditing && envelopeToEdit) {
        const updatePayload: UpdateEnvelopePayload = {
          name: name.trim(),
          groupType,
          monthlyBudget: budgetVal,
        };
        await api.updateEnvelope(envelopeToEdit.id, updatePayload);
      } else {
        const createPayload: CreateEnvelopePayload = {
          name: name.trim(),
          groupType,
          monthlyBudget: budgetVal,
        };
        await api.createEnvelope(createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!envelopeToEdit) return;
    try {
      setIsSubmitting(true);
      await api.deleteEnvelope(envelopeToEdit.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete envelope');
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
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--fg)] tracking-tight">
                {isEditing ? 'Edit Budget Envelope' : 'New Budget Envelope'}
              </h3>
              <p className="text-[11px] text-[var(--fg-muted)]">Assign spending targets to keep monthly cash flows disciplined</p>
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

          {/* Group 50/30/20 Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
              Budget Pillar Allocation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ENVELOPE_GROUPS.map((g) => {
                const Icon = g.icon;
                const isSelected = groupType === g.group;
                return (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() => setGroupType(g.group)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)] shadow-sm'
                        : 'bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-[var(--bg)]' : 'text-[var(--fg-muted)]'}`} />
                    <div>
                      <span className="font-bold text-xs block leading-tight">{g.label}</span>
                      <span className="text-[10px] block opacity-70 leading-tight mt-0.5">{g.ratio}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Envelope Name */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries, Restaurants, Utilities, Transit..."
              required
              autoFocus
              className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
            />
          </div>

          {/* HERO MONTHLY BUDGET LIMIT STAGE */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                Monthly Spending Ceiling
              </label>
              <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                {currentCurrency.code} / month
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[var(--fg-muted)] tabular-nums">{currentCurrency.symbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-transparent text-2xl font-extrabold text-[var(--fg)] tracking-tight focus:outline-none tabular-nums"
              />
            </div>

            {/* Quick Increment Presets */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border)]/60 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--fg-muted)] shrink-0 font-medium mr-1">Quick Add:</span>
              {[50, 100, 250, 500].map((preset) => (
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
            </div>
          </div>

          {/* INLINE DELETE CONFIRMATION BANNER */}
          {confirmDelete && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Confirm Category Deletion</span>
              </div>
              <p className="text-[11px] text-rose-300/80">
                Are you sure you want to delete <strong>{envelopeToEdit?.name}</strong>? Transactions in this envelope
                will become unbudgeted.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete Envelope'}
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
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Envelope'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
