import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';
import { BudgetEnvelope, EnvelopeGroup } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import { Progress, Badge } from '../dashboard/charts';

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
      title: '50% Needs & Fixed Commitments',
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
      title: '20% Savings, Vaults & Debt',
      subtitle: 'Emergency buffer, investments, and debt payoff',
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
      alert('Monthly income of $4,500 allocated using 50/30/20 target ratios.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[#1c1c1c]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f4]">Envelope Budgets</h2>
          <p className="text-xs text-[#9e9e98] mt-0.5">
            Zero-based envelope budgeting with surplus rollover and overspend protection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRebalanceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:opacity-90 transition shadow-sm"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Rebalance Envelopes</span>
          </button>
          <button
            onClick={handleAutoAllocate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#181818] hover:bg-[#222222] text-[#f5f5f4] border border-[#242424] transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9e9e98]" />
            <span>Auto-Allocate (50/30/20)</span>
          </button>
        </div>
      </div>

      {/* Envelopes by 50/30/20 Group */}
      <div className="space-y-5">
        {groups.map((grp) => {
          const groupEnvelopes = envelopes.filter((e) => e.groupType === grp.key);
          const totalBudget = groupEnvelopes.reduce((sum, e) => sum + e.monthlyBudget, 0);
          const totalSpent = groupEnvelopes.reduce((sum, e) => sum + e.spentAmount, 0);

          return (
            <div key={grp.key} className="bg-[#121212] p-5 rounded-2xl border border-[#242424] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#1e1e1e] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#f5f5f4] text-sm">{grp.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e1e1e] border border-[#2c2c2c] text-[#9e9e98]">
                      Target {grp.targetRatio}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6b6b66] mt-0.5">{grp.subtitle}</p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[#9e9e98]">Total: </span>
                  <span className="font-semibold text-[#f5f5f4]">{formatAmount(totalSpent)}</span>
                  <span className="text-[#6b6b66]"> / {formatAmount(totalBudget)}</span>
                </div>
              </div>

              {/* Grid of Envelopes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupEnvelopes.map((env) => {
                  const remaining = env.monthlyBudget - env.spentAmount;
                  const ratio = env.monthlyBudget > 0 ? env.spentAmount / env.monthlyBudget : 0;
                  const isOverspent = remaining < 0;

                  return (
                    <div
                      key={env.id}
                      className="p-4 rounded-xl bg-[#181818] border border-[#242424] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-[#f5f5f4]">{env.name}</span>
                        {isOverspent ? (
                          <Badge tone="critical">Overspent</Badge>
                        ) : ratio > 0.8 ? (
                          <Badge tone="warning">Warning</Badge>
                        ) : (
                          <Badge tone="good">On Track</Badge>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-bold text-[#f5f5f4] tabular">
                            {formatAmount(env.spentAmount)}
                          </span>
                          <span className="text-xs text-[#6b6b66]"> of {formatAmount(env.monthlyBudget)}</span>
                        </div>
                        <span
                          className={`text-xs tabular font-medium ${
                            isOverspent ? 'text-rose-400' : 'text-[#9e9e98]'
                          }`}
                        >
                          {isOverspent ? `-${formatAmount(Math.abs(remaining))}` : `${formatAmount(remaining)} left`}
                        </span>
                      </div>

                      <Progress
                        value={ratio}
                        color={isOverspent ? '#ef4444' : ratio > 0.8 ? '#f59e0b' : '#10b981'}
                      />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <h3 className="font-semibold text-[#f5f5f4] text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#9e9e98]" /> Rebalance Envelope Surplus
              </h3>
              <button
                type="button"
                onClick={() => setIsRebalanceModalOpen(false)}
                className="text-[#9e9e98] hover:text-[#f5f5f4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRebalance} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9e9e98] mb-1 font-medium">Source Envelope (Surplus)</label>
                <select
                  value={sourceEnvId}
                  onChange={(e) => setSourceEnvId(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2 text-[#f5f5f4]"
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
                <label className="block text-[#9e9e98] mb-1 font-medium">Target Envelope (Deficit)</label>
                <select
                  value={targetEnvId}
                  onChange={(e) => setTargetEnvId(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2 text-[#f5f5f4]"
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
                <label className="block text-[#9e9e98] mb-1 font-medium">Amount to Rebalance</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50.00"
                  value={rebalanceAmount}
                  onChange={(e) => setRebalanceAmount(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2 text-[#f5f5f4] font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsRebalanceModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[#9e9e98] hover:text-[#f5f5f4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !sourceEnvId || !targetEnvId || !rebalanceAmount}
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold disabled:opacity-50"
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
