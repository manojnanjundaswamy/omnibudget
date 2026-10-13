import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Target,
  ShieldCheck,
  Home,
  Plane,
  Car,
  Sparkles,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Goal, CreateGoalPayload, UpdateGoalPayload } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
  onSuccess: () => void;
}

const GOAL_CATEGORIES = [
  { id: 'EMERGENCY', name: 'Emergency Fund', icon: ShieldCheck, color: '#10b981' },
  { id: 'HOME', name: 'Home & Real Estate', icon: Home, color: '#3b82f6' },
  { id: 'VACATION', name: 'Travel & Vacation', icon: Plane, color: '#f59e0b' },
  { id: 'PURCHASE', name: 'Major Purchase', icon: Car, color: '#8b5cf6' },
  { id: 'RETIREMENT', name: 'Retirement & Wealth', icon: Sparkles, color: '#ec4899' },
  { id: 'SAVINGS', name: 'General Savings', icon: Target, color: '#6366f1' },
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
  onSuccess,
}) => {
  const { currentCurrency, formatAmount } = useCurrency();
  const isEditing = !!goalToEdit;

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState('SAVINGS');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmount(goalToEdit.targetAmount.toString());
      setCurrentAmount(goalToEdit.currentAmount.toString());
      setCategory(goalToEdit.category || 'SAVINGS');
      setTargetDate(goalToEdit.targetDate || '');
      setColor(goalToEdit.color || '#10b981');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setCategory('EMERGENCY');
      setTargetDate('');
      setColor('#10b981');
    }
    setError('');
    setConfirmDelete(false);
  }, [goalToEdit, isOpen]);

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

  const parsedTarget = parseFloat(targetAmount) || 0;
  const parsedCurrent = parseFloat(currentAmount) || 0;
  const progressPct = parsedTarget > 0 ? Math.min(100, Math.round((parsedCurrent / parsedTarget) * 100)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a goal name');
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please enter a valid target amount greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditing && goalToEdit) {
        const payload: UpdateGoalPayload = {
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          category,
          targetDate: targetDate || undefined,
          color,
        };
        await api.updateGoal(goalToEdit.id, payload);
      } else {
        const payload: CreateGoalPayload = {
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          category,
          targetDate: targetDate || undefined,
          color,
        };
        await api.createGoal(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!goalToEdit) return;
    try {
      setIsSubmitting(true);
      await api.deleteGoal(goalToEdit.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete goal');
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
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--fg)] tracking-tight">
                {isEditing ? 'Edit Financial Milestone' : 'Set Financial Milestone'}
              </h3>
              <p className="text-[11px] text-[var(--fg-muted)]">Track long-term savings, rainy day funds, and life dreams</p>
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

          {/* Category Chips Grid */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
              Goal Purpose & Icon
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GOAL_CATEGORIES.map((c) => {
                const Icon = c.icon;
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategory(c.id);
                      setColor(c.color);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)] shadow-sm'
                        : 'bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: isSelected ? 'inherit' : c.color }} />
                    <span className="font-semibold text-xs leading-tight">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Name */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 6-Month Emergency Runway, House Downpayment..."
              required
              autoFocus
              className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
            />
          </div>

          {/* TARGET & CURRENT AMOUNT STAGE */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1">
                  Target Amount
                </label>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-[var(--fg-muted)]">{currentCurrency.symbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="10000.00"
                    required
                    className="w-full bg-transparent text-xl font-extrabold text-[var(--fg)] tracking-tight focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1">
                  Currently Saved
                </label>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-[var(--fg-muted)]">{currentCurrency.symbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-xl font-extrabold text-[var(--fg)] tracking-tight focus:outline-none tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* LIVE FUNDING PROGRESS BAR */}
            {parsedTarget > 0 && (
              <div className="pt-2 border-t border-[var(--border)]/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-[var(--fg-muted)]">Progress to completion</span>
                  <span className="font-bold tabular-nums" style={{ color }}>
                    {progressPct}% ({formatAmount(parsedCurrent)} of {formatAmount(parsedTarget)})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* TARGET DATE */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
              <span>Target Completion Date (Optional)</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full input-luxury px-3.5 py-2.5 text-xs text-[var(--fg)] font-medium"
            />
          </div>

          {/* INLINE DELETE CONFIRMATION BANNER */}
          {confirmDelete && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Confirm Goal Deletion</span>
              </div>
              <p className="text-[11px] text-rose-300/80">
                Are you sure you want to delete the <strong>{goalToEdit?.name}</strong> milestone?
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete Milestone'}
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
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Milestone'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
