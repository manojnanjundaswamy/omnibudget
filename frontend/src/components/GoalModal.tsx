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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222228] bg-[#16161a]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#f4f4f5] text-sm">
                {isEditing ? 'Edit Financial Goal' : 'Create Financial Milestone'}
              </h3>
              <p className="text-xs text-[#71717a]">Long-term wealth building & target tracking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#1e1e24] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Goal Name */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 6-Month Emergency Reserve, Home Down Payment"
              required
              className="w-full bg-[#16161a] border border-[#27272a] focus:border-neutral-500 rounded-xl px-3.5 py-2.5 text-xs text-[#f4f4f5] focus:outline-none transition"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Goal Category</label>
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
                        ? 'border-[#f4f4f5] bg-[#1e1e24] text-[#f4f4f5]'
                        : 'border-[#222228] bg-[#16161a] text-[#71717a] hover:border-[#383842]'
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
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Target Amount</label>
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="20000.00"
                required
                className="w-full bg-[#16161a] border border-[#27272a] focus:border-neutral-500 rounded-xl px-3.5 py-2.5 text-xs text-[#f4f4f5] focus:outline-none transition tabular"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Current Saved</label>
              <input
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#16161a] border border-[#27272a] focus:border-neutral-500 rounded-xl px-3.5 py-2.5 text-xs text-[#f4f4f5] focus:outline-none transition tabular"
              />
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Target Date (Optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-[#16161a] border border-[#27272a] focus:border-neutral-500 rounded-xl px-3.5 py-2.5 text-xs text-[#f4f4f5] focus:outline-none transition"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#222228]">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 transition"
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
                className="px-4 py-2 rounded-xl text-xs text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#1e1e24] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f4f4f5] hover:bg-white text-[#09090b] transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
