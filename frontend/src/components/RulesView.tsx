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
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-indigo-400" />
              Automated Categorization Rules
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              Monarch-Grade
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Create custom rules that automatically detect merchants, assign budget categories, and standardize transaction labels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isRunningAll || rules.length === 0}
            onClick={handleRunAll}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-emerald-400 ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>{isRunningAll ? 'Running Rules...' : 'Run Rules on All'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
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
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs text-zinc-400">Loading categorization rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Wand2 className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No rules defined yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Automate your workflow by creating rules that auto-tag transactions matching specific keywords.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
            >
              Create First Rule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      onClick={() => handleToggleActive(rule)}
                      className={`cursor-pointer transition-colors ${
                        rule.isActive ? 'text-emerald-400' : 'text-zinc-600'
                      }`}
                      title={rule.isActive ? 'Rule active (click to disable)' : 'Rule paused (click to activate)'}
                    >
                      {rule.isActive ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{rule.name}</h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="text-zinc-500">IF</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 font-mono text-[11px] text-zinc-300">
                      {rule.matchField}
                    </span>
                    <span className="text-zinc-500">{rule.matchType.toLowerCase().replace('_', ' ')}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                      "{rule.matchValue}"
                    </span>
                    <span className="text-zinc-500">➔ THEN SET CATEGORY</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {rule.applyCategory}
                    </span>
                    {rule.applyMerchant && (
                      <>
                        <span className="text-zinc-500">& MERCHANT</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
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
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                New Categorization Rule
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Categorize Uber to Rideshare & Transit"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Target Field</label>
                  <select
                    value={matchField}
                    onChange={e => setMatchField(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DESCRIPTION">Description</option>
                    <option value="MERCHANT">Merchant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Condition</label>
                  <select
                    value={matchType}
                    onChange={e => setMatchType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CONTAINS">Contains keyword</option>
                    <option value="EQUALS">Exactly equals</option>
                    <option value="STARTS_WITH">Starts with</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Keyword / Match Value</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uber, Netflix, Whole Foods"
                  value={matchValue}
                  onChange={e => setMatchValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Assign Category</label>
                <select
                  value={applyCategory}
                  onChange={e => setApplyCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Standardize Merchant Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uber Technologies, Netflix Inc"
                  value={applyMerchant}
                  onChange={e => setApplyMerchant(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
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
