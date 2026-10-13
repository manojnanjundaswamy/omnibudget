import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Trash2, Tag } from 'lucide-react';
import { BudgetEnvelope, EnvelopeGroup, CreateEnvelopePayload, UpdateEnvelopePayload } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface EnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelopeToEdit?: BudgetEnvelope | null;
  onSuccess: () => void;
}

export const EnvelopeModal: React.FC<EnvelopeModalProps> = ({
  isOpen,
  onClose,
  envelopeToEdit,
  onSuccess,
}) => {
  const { currentCurrency } = useCurrency();
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<EnvelopeGroup>('NEEDS');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
  }, [envelopeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an envelope category name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditing && envelopeToEdit) {
        const updatePayload: UpdateEnvelopePayload = {
          name,
          groupType,
          monthlyBudget: parseFloat(monthlyBudget) || 0,
        };
        await api.updateEnvelope(envelopeToEdit.id, updatePayload);
      } else {
        const createPayload: CreateEnvelopePayload = {
          name,
          groupType,
          monthlyBudget: parseFloat(monthlyBudget) || 0,
        };
        await api.createEnvelope(createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save envelope');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!envelopeToEdit) return;
    if (!confirm(`Are you sure you want to delete ${envelopeToEdit.name}?`)) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--fg)] text-sm">
                {isEditing ? 'Edit Budget Category' : 'Add Budget Category'}
              </h3>
              <p className="text-xs text-[var(--fg-muted)]">Set a monthly target for this category</p>
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
            <label className="block text-[var(--fg-muted)] mb-1 font-medium">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries, Dining, Rent, Travel"
              required
              autoFocus
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--fg-muted)] mb-1 font-medium">Budget Group</label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value as EnvelopeGroup)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="NEEDS">Needs & Essentials</option>
                <option value="WANTS">Wants & Lifestyle</option>
                <option value="SAVINGS_AND_DEBT">Savings & Debt</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--fg-muted)] mb-1 font-medium">
                Monthly Target ({currentCurrency.code})
              </label>
              <input
                type="number"
                step="0.01"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] font-semibold focus:outline-none focus:border-[var(--accent)] tabular-nums"
              />
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
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
