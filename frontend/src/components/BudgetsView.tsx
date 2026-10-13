import React, { useState } from 'react';
import {
  PiggyBank,
  Sparkles,
  ArrowRightLeft,
  AlertTriangle,
  Plus,
  CheckCircle2,
  X,
} from 'lucide-react';
import { BudgetEnvelope, EnvelopeGroup } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface BudgetsViewProps {
  envelopes: BudgetEnvelope[];
  onRefresh: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ envelopes, onRefresh }) => {
  const { formatAmount } = useCurrency();
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);
  const [sourceEnvId, setSourceEnvId] = useState('');
  const [targetEnvId, setTargetEnvId] = useState('');
  const [rebalanceAmount, setRebalanceAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groups: { key: EnvelopeGroup; title: string; subtitle: string; targetRatio: string }[] = [
    {
      key: 'NEEDS',
      title: '50% Needs & Fixed Obligations',
      subtitle: 'Rent, groceries, power, insurance & essential living expenses',
      targetRatio: '50%',
    },
    {
      key: 'WANTS',
      title: '30% Lifestyle & Discretionary',
      subtitle: 'Dining out, weekend leisure, concerts & shopping',
      targetRatio: '30%',
    },
    {
      key: 'SAVINGS_AND_DEBT',
      title: '20% Savings, Vaults & Debt Payoff',
      subtitle: 'Emergency buffer, investments, and retirement',
      targetRatio: '20%',
    },
  ];

  const handleRebalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceEnvId || !targetEnvId || !rebalanceAmount) return;

    try {
      setIsSubmitting(true);
      await api.rebalanceEnvelopes(sourceEnvId, targetEnvId, parseFloat(rebalanceAmount));
      setIsRebalanceModalOpen(false);
      setRebalanceAmount('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoAllocate = async () => {
    try {
      await api.autoAllocateIncome(4500.0);
      onRefresh();
      alert('Monthly income of $4,500 successfully allocated across envelopes using 50/30/20 target ratios!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Zero-Based Envelope Studio</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every dollar has a job • 50/30/20 auto-allocation with surplus rollover protection
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRebalanceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Rebalance Envelopes</span>
          </button>
          <button
            onClick={handleAutoAllocate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition"
            title="Auto allocate $4,500 monthly income"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Allocate (50/30/20)</span>
          </button>
        </div>
      </div>

      {/* Envelopes by 50/30/20 Group */}
      <div className="space-y-6">
        {groups.map((grp) => {
          const groupEnvelopes = envelopes.filter((e) => e.groupType === grp.key);
          const totalBudget = groupEnvelopes.reduce((sum, e) => sum + e.monthlyBudget, 0);
          const totalSpent = groupEnvelopes.reduce((sum, e) => sum + e.spentAmount, 0);
          const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

          return (
            <div key={grp.key} className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-sm">{grp.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300">
                      Target: {grp.targetRatio}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{grp.subtitle}</p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400">Total Group: </span>
                  <span className="font-bold text-slate-100">{formatAmount(totalSpent)}</span>
                  <span className="text-slate-500"> / {formatAmount(totalBudget)}</span>
                </div>
              </div>

              {/* Grid of Envelopes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupEnvelopes.map((env) => {
                  const remaining = env.monthlyBudget - env.spentAmount;
                  const ratio = env.monthlyBudget > 0 ? (env.spentAmount / env.monthlyBudget) * 100 : 0;
                  const isOverspent = remaining < 0;

                  return (
                    <div
                      key={env.id}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200">{env.name}</span>
                        {isOverspent && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3" /> Overspent
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-lg font-black text-slate-100">
                            {formatAmount(env.spentAmount)}
                          </span>
                          <span className="text-xs text-slate-400"> of {formatAmount(env.monthlyBudget)}</span>
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            isOverspent ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isOverspent ? `-${formatAmount(Math.abs(remaining))}` : `${formatAmount(remaining)} left`}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverspent
                              ? 'bg-rose-500'
                              : ratio > 80
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, ratio)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rebalance Modal */}
      {isRebalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" /> Rebalance Envelope Surplus
              </h3>
              <button
                onClick={() => setIsRebalanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRebalance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Source Envelope (Surplus funds)</label>
                <select
                  value={sourceEnvId}
                  onChange={(e) => setSourceEnvId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="">Select source envelope...</option>
                  {envelopes.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({formatAmount(e.monthlyBudget - e.spentAmount)} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Envelope (Deficit / Overspent)</label>
                <select
                  value={targetEnvId}
                  onChange={(e) => setTargetEnvId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="">Select target envelope...</option>
                  {envelopes.map((e) => (
                    <option key={e.id} value={e.id} disabled={e.id === sourceEnvId}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Amount to Transfer</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50.00"
                  value={rebalanceAmount}
                  onChange={(e) => setRebalanceAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRebalanceModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !sourceEnvId || !targetEnvId || !rebalanceAmount}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Balancing...' : 'Rebalance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
