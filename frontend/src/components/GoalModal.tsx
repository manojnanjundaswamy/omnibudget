import React, { useState, useEffect } from 'react';
import { X, Trophy, Target, ShieldCheck, Home, Plane, Car, Sparkles, Trash2 } from 'lucide-react';
import { Goal, CreateGoalPayload, UpdateGoalPayload } from '../types';
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
  const isEditing = !!goalToEdit;

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState('SAVINGS');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmt = parseFloat(targetAmount);
    const currAmt = parseFloat(currentAmount) || 0;

    if (!name.trim()) {
      setError('Please enter a goal name');
      return;
    }
    if (isNaN(targetAmt) || targetAmt <= 0) {
      setError('Please enter a valid target amount greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditing && goalToEdit) {
        const payload: UpdateGoalPayload = {
          name: name.trim(),
          targetAmount: targetAmt,
          currentAmount: currAmt,
          category,
          targetDate: targetDate || undefined,
          color,
        };
        await api.updateGoal(goalToEdit.id, payload);
      } else {
        const payload: CreateGoalPayload = {
          name: name.trim(),
          targetAmount: targetAmt,
          currentAmount: currAmt,
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
    if (!confirm(`Are you sure you want to delete the "${goalToEdit.name}" goal?`)) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--fg)] text-sm">
                {isEditing ? 'Edit Savings Goal' : 'Add Savings Goal'}
              </h3>
              <p className="text-xs text-[var(--fg-muted)]">Set a target to keep track of your progress</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500">
              {error}
            </div>
          )}

          {/* Goal Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund, Vacation, New Laptop"
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg)] focus:outline-none transition"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      setColor(cat.color);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--fg)] font-semibold shadow-sm'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
                    <span className="text-[11px] font-medium truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amounts Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">Target Amount</label>
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="20000.00"
                required
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg)] focus:outline-none transition tabular"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">Current Saved</label>
              <input
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg)] focus:outline-none transition tabular"
              />
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">Target Date (Optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg)] focus:outline-none transition"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Goal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
