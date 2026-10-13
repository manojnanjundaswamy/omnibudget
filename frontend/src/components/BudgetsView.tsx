import React, { useState } from 'react';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { BudgetEnvelope, EnvelopeGroup, Transaction } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface BudgetsViewProps {
  envelopes: BudgetEnvelope[];
  transactions?: Transaction[];
  onRefresh: () => void;
  onOpenAddEnvelope: () => void;
  onEditEnvelope: (env: BudgetEnvelope) => void;
  onNavigateToTransactions: (filter?: { envelopeId?: string; category?: string }) => void;
  onOpenDrilldown?: (title: string, transactions: Transaction[], subtitle?: string) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  envelopes,
  transactions = [],
  onRefresh,
  onOpenAddEnvelope,
  onEditEnvelope,
  onNavigateToTransactions,
  onOpenDrilldown,
}) => {
  const { formatAmount } = useCurrency();

  const totalBudget = envelopes.reduce((acc, e) => acc + (e.monthlyBudget || 0), 0);
  const totalSpent = envelopes.reduce((acc, e) => acc + (e.spentAmount || 0), 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const groups: { key: EnvelopeGroup; title: string; subtitle: string }[] = [
    {
      key: 'NEEDS',
      title: 'Essential Living & Needs',
      subtitle: 'Housing, groceries, utilities, transit, and fixed commitments',
    },
    {
      key: 'WANTS',
      title: 'Discretionary & Lifestyle',
      subtitle: 'Dining out, weekend leisure, shopping, travel, and personal hobbies',
    },
    {
      key: 'SAVINGS_AND_DEBT',
      title: 'Savings, Investments & Debt',
      subtitle: 'Emergency buffer sweeps, index funds, and debt reduction',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1e1e24]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]">Category Budgets</h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Monarch-grade monthly category spending targets and real-time tracking
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddEnvelope}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f4f4f5] hover:bg-white text-[#09090b] text-xs font-semibold transition active:scale-[0.98] shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Budget Category</span>
        </button>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] space-y-1">
          <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider block">
            Total Monthly Budget
          </span>
          <span className="text-2xl font-bold tracking-tight text-[#f4f4f5] tabular block">
            {formatAmount(totalBudget)}
          </span>
          <span className="text-[11px] text-[#71717a]">
            Across {envelopes.length} budgeted categories
          </span>
        </div>

        <div
          onClick={() => {
            if (onOpenDrilldown) {
              const expenseTxs = transactions.filter((t) => t.type === 'EXPENSE');
              onOpenDrilldown('Monthly Budget Expenses', expenseTxs, `Total spent: ${formatAmount(totalSpent)} across ${expenseTxs.length} transactions`);
            } else {
              onNavigateToTransactions();
            }
          }}
          className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-emerald-500/40 cursor-pointer transition space-y-1 group"
          title="Click to drill down into all spent transactions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider block">
              Actual Spent So Far
            </span>
            <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition">
              Drill down →
            </span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-neutral-200 tabular block group-hover:text-white transition">
            {formatAmount(totalSpent)}
          </span>
          <span className="text-[11px] text-[#71717a]">
            {overallUsed}% of target cap consumed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] space-y-1">
          <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider block">
            Remaining to Spend
          </span>
          <span
            className={`text-2xl font-bold tracking-tight tabular block ${
              totalSpent > totalBudget ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatAmount(totalRemaining)}
          </span>
          <span className="text-[11px] text-[#71717a]">
            {totalSpent > totalBudget ? 'Over budget limit' : 'Available headroom'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] space-y-1">
          <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider block">
            Budget Health
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#f4f4f5] tabular block">
              {overallUsed}%
            </span>
            {overallUsed > 100 ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1e1e24] overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallUsed > 100
                  ? 'bg-rose-500'
                  : overallUsed > 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, overallUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Groups */}
      <div className="space-y-6">
        {groups.map((grp) => {
          const groupEnvelopes = envelopes.filter((e) => e.groupType === grp.key);
          const grpBudget = groupEnvelopes.reduce((acc, e) => acc + (e.monthlyBudget || 0), 0);
          const grpSpent = groupEnvelopes.reduce((acc, e) => acc + (e.spentAmount || 0), 0);

          if (groupEnvelopes.length === 0) return null;

          return (
            <div key={grp.key} className="space-y-3">
              {/* Group Header */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="font-semibold text-sm text-[#f4f4f5] tracking-tight">{grp.title}</h3>
                  <p className="text-[11px] text-[#71717a]">{grp.subtitle}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[#a1a1aa] font-medium tabular">
                    {formatAmount(grpSpent)} / {formatAmount(grpBudget)}
                  </span>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {groupEnvelopes.map((env) => {
                  const usedPercent =
                    env.monthlyBudget > 0
                      ? Math.round((env.spentAmount / env.monthlyBudget) * 100)
                      : 0;
                  const isOver = env.spentAmount > env.monthlyBudget;
                  const remaining = Math.max(0, env.monthlyBudget - env.spentAmount);

                  return (
                    <div
                      key={env.id}
                      className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-[#383842] transition-all flex flex-col justify-between space-y-3 shadow-sm group"
                    >
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${env.color || '#10b981'}15`,
                              borderColor: `${env.color || '#10b981'}30`,
                              color: env.color || '#10b981',
                            }}
                          >
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-[#f4f4f5] line-clamp-1">
                              {env.name}
                            </h4>
                            <span className="text-[10px] text-[#71717a] block">
                              Monthly Target: {formatAmount(env.monthlyBudget)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onEditEnvelope(env)}
                          className="p-1 rounded-md text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#1a1a1f] transition text-xs font-medium"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#f4f4f5] tabular">
                            {formatAmount(env.spentAmount)} spent
                          </span>
                          <span
                            className={`font-semibold tabular ${
                              isOver ? 'text-rose-400' : 'text-[#71717a]'
                            }`}
                          >
                            {isOver ? `+${formatAmount(env.spentAmount - env.monthlyBudget)} over` : `${formatAmount(remaining)} left`}
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-[#18181c] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOver
                                ? 'bg-rose-500'
                                : usedPercent > 80
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, usedPercent)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#71717a]">
                          <span>{usedPercent}% used</span>
                          {isOver && <span className="text-rose-400 font-semibold">Exceeded Cap</span>}
                        </div>
                      </div>

                      {/* Card Footer: Drilldown & Ledger Link */}
                      <div className="pt-2 border-t border-[#1c1c22] flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenDrilldown) {
                              const catTxs = transactions.filter(
                                (t) =>
                                  t.envelopeId === env.id ||
                                  (t.category && t.category.toLowerCase() === env.name.toLowerCase())
                              );
                              onOpenDrilldown(
                                `${env.name} Spending`,
                                catTxs,
                                `Target: ${formatAmount(env.monthlyBudget)} • Spent: ${formatAmount(env.spentAmount)}`
                              );
                            } else {
                              onNavigateToTransactions({
                                envelopeId: env.id,
                                category: env.name,
                              });
                            }
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-medium transition flex items-center gap-1 group/btn"
                        >
                          <span>Drilldown</span>
                          <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onNavigateToTransactions({
                              envelopeId: env.id,
                              category: env.name,
                            })
                          }
                          className="text-[#71717a] hover:text-[#f4f4f5] transition text-[10px]"
                        >
                          Ledger →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
