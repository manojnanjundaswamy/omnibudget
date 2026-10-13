import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Plus,
  Play,
  Trash2,
  Check,
  AlertCircle,
  Tag,
  Search,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { TransactionRule, CreateRulePayload } from '../types';
import { api } from '../services/api';

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Transportation',
  'Housing & Rent',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health & Medical',
  'Fitness',
  'Education',
  'Travel',
  'Salary',
  'Investment',
];

export const RulesView: React.FC = () => {
  const [rules, setRules] = useState<TransactionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [matchField, setMatchField] = useState<'DESCRIPTION' | 'MERCHANT'>('DESCRIPTION');
  const [matchType, setMatchType] = useState<'CONTAINS' | 'EQUALS' | 'STARTS_WITH'>('CONTAINS');
  const [matchValue, setMatchValue] = useState('');
  const [applyCategory, setApplyCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [applyMerchant, setApplyMerchant] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRules();
      setRules(data);
    } catch (err) {
      console.error('Error fetching rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (rule: TransactionRule) => {
    try {
      const updated = await api.updateRule(rule.id, { isActive: !rule.isActive });
      setRules(rules.map(r => (r.id === rule.id ? updated : r)));
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRule(id);
      setRules(rules.filter(r => r.id !== id));
      setNotification({ message: 'Rule deleted successfully', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    setNotification(null);
    try {
      const res = await api.runRulesOnAll();
      setNotification({
        message: `Rules executed! Evaluated ${res.totalTransactions} transactions and auto-categorized ${res.updatedCount}.`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({ message: 'Failed to run rules on transactions', type: 'error' });
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !matchValue || !applyCategory) return;

    try {
      const payload: CreateRulePayload = {
        name,
        matchField,
        matchType,
        matchValue,
        applyCategory,
        applyMerchant: applyMerchant.trim() || undefined,
        isActive: true,
      };
      const created = await api.createRule(payload);
      setRules([created, ...rules]);
      setIsModalOpen(false);
      resetForm();
      setNotification({ message: `Rule "${created.name}" created and active!`, type: 'success' });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to create rule:', err);
    }
  };

  const resetForm = () => {
    setName('');
    setMatchField('DESCRIPTION');
    setMatchType('CONTAINS');
    setMatchValue('');
    setApplyCategory(DEFAULT_CATEGORIES[0]);
    setApplyMerchant('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-[var(--accent)]" />
              Categorization Rules
            </h1>
          </div>
          <p className="text-xs text-[var(--fg-muted)] mt-1">
            Automatically detect merchants and assign categories to transactions matching specific keywords.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isRunningAll || rules.length === 0}
            onClick={handleRunAll}
            className="px-3.5 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-emerald-500 ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>{isRunningAll ? 'Running Rules...' : 'Run Rules on All'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Rules List Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-[var(--accent)] animate-spin" />
            <p className="text-xs text-[var(--fg-muted)]">Loading categorization rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Wand2 className="w-10 h-10 text-[var(--fg-muted)] mx-auto" />
            <h3 className="text-sm font-semibold text-[var(--fg)]">No rules created yet</h3>
            <p className="text-xs text-[var(--fg-muted)] max-w-sm mx-auto">
              Automate your workflow by creating rules that auto-tag transactions matching specific keywords.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-semibold rounded-xl"
            >
              Create First Rule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      onClick={() => handleToggleActive(rule)}
                      className={`cursor-pointer transition-colors ${
                        rule.isActive ? 'text-emerald-500' : 'text-[var(--fg-muted)]'
                      }`}
                      title={rule.isActive ? 'Rule active (click to disable)' : 'Rule paused (click to activate)'}
                    >
                      {rule.isActive ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </span>
                    <h4 className="text-sm font-semibold text-[var(--fg)]">{rule.name}</h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--fg-muted)]">
                    <span>IF</span>
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11px] text-[var(--fg)]">
                      {rule.matchField}
                    </span>
                    <span>{rule.matchType.toLowerCase().replace('_', ' ')}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-semibold">
                      "{rule.matchValue}"
                    </span>
                    <span>➔ THEN SET CATEGORY</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {rule.applyCategory}
                    </span>
                    {rule.applyMerchant && (
                      <>
                        <span>& MERCHANT</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold">
                          {rule.applyMerchant}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(rule)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      rule.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--fg)] flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[var(--accent)]" />
                New Categorization Rule
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Categorize Uber to Rideshare & Transit"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-xs placeholder:[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Target Field</label>
                  <select
                    value={matchField}
                    onChange={e => setMatchField(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-xs focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="DESCRIPTION">Description</option>
                    <option value="MERCHANT">Merchant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Condition</label>
                  <select
                    value={matchType}
                    onChange={e => setMatchType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-xs focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="CONTAINS">Contains keyword</option>
                    <option value="EQUALS">Exactly equals</option>
                    <option value="STARTS_WITH">Starts with</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Keyword / Match Value</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uber, Netflix, Whole Foods"
                  value={matchValue}
                  onChange={e => setMatchValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-xs placeholder:[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">Assign Category</label>
                <select
                  value={applyCategory}
                  onChange={e => setApplyCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-xs focus:outline-none focus:border-[var(--accent)]"
                >
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fg-muted)] mb-1">
                  Standardize Merchant (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uber Technologies, Netflix Inc"
                  value={applyMerchant}
                  onChange={e => setApplyMerchant(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-xs placeholder:[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-bold transition"
                >
                  Save & Apply Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
