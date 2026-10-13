import React from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { DashboardSummary, Transaction, TransactionFilter } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface CashFlowViewProps {
  summary: DashboardSummary | null;
  transactions: Transaction[];
  onNavigateToTransactions: (filter?: TransactionFilter) => void;
  onOpenDrilldown?: (title: string, transactions: Transaction[], subtitle?: string) => void;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  summary,
  transactions,
  onNavigateToTransactions,
  onOpenDrilldown,
}) => {
  const { formatAmount } = useCurrency();

  const income = summary?.totalIncomeThisMonth || 0;
  const expenses = summary?.totalExpensesThisMonth || 0;
  const netSaved = income - expenses;
  const savingsRate = income > 0 ? Math.max(0, Math.round((netSaved / income) * 100)) : 0;

  // Compute category spending map from actual transactions
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((tx) => tx.type === 'EXPENSE')
    .forEach((tx) => {
      const cat = tx.category || 'Uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(tx.amount);
    });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const totalCategorySpent = sortedCategories.reduce((acc, [, amt]) => acc + amt, 0);

  // Compute income sources
  const incomeTotals: Record<string, number> = {};
  transactions
    .filter((tx) => tx.type === 'INCOME')
    .forEach((tx) => {
      const cat = tx.category || tx.merchant || 'General Income';
      incomeTotals[cat] = (incomeTotals[cat] || 0) + Math.abs(tx.amount);
    });

  const sortedIncomes = Object.entries(incomeTotals).sort((a, b) => b[1] - a[1]);

  // Days left in current month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const avgDailySpend = currentDay > 0 ? expenses / currentDay : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1e1e24]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]">Cash Flow & Financial Velocity</h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Monarch-style cash velocity engine • Income vs expenses • Savings rate KPI
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141417] border border-[#222228] text-xs text-[#a1a1aa]">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span>Current Billing Cycle (Day {currentDay} of {daysInMonth})</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Income Card */}
        <div
          onClick={() => {
            const incomeTxs = transactions.filter((t) => t.type === 'INCOME');
            if (onOpenDrilldown) {
              onOpenDrilldown(
                'Monthly Inflow & Income',
                incomeTxs,
                `Total: +${formatAmount(income)} across ${incomeTxs.length} records`
              );
            } else {
              onNavigateToTransactions({ type: 'INCOME' });
            }
          }}
          className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-emerald-500/40 cursor-pointer transition space-y-2 group"
          title="Click to drill down into income transactions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">
              Total Inflow (Income)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-emerald-400 tabular block">
            +{formatAmount(income)}
          </span>
          <span className="text-[11px] text-[#71717a] block flex items-center justify-between">
            <span>{sortedIncomes.length} recorded income sources</span>
            <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition">Drilldown →</span>
          </span>
        </div>

        {/* Expenses Card */}
        <div
          onClick={() => {
            const expenseTxs = transactions.filter((t) => t.type === 'EXPENSE');
            if (onOpenDrilldown) {
              onOpenDrilldown(
                'Monthly Outflow & Expenses',
                expenseTxs,
                `Total: -${formatAmount(expenses)} across ${expenseTxs.length} records`
              );
            } else {
              onNavigateToTransactions({ type: 'EXPENSE' });
            }
          }}
          className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] hover:border-rose-500/40 cursor-pointer transition space-y-2 group"
          title="Click to drill down into expense transactions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">
              Total Outflow (Expenses)
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#f4f4f5] tabular block">
            -{formatAmount(expenses)}
          </span>
          <span className="text-[11px] text-[#71717a] block flex items-center justify-between">
            <span>Average {formatAmount(avgDailySpend)} / day</span>
            <span className="text-[10px] text-rose-400 opacity-0 group-hover:opacity-100 transition">Drilldown →</span>
          </span>
        </div>

        {/* Net Savings Card */}
        <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">
              Net Capital Retained
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span
            className={`text-2xl font-bold tracking-tight tabular block ${
              netSaved >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netSaved >= 0 ? '+' : ''}
            {formatAmount(netSaved)}
          </span>
          <span className="text-[11px] text-[#71717a] block">
            {netSaved >= 0 ? 'Positive cash flow trajectory' : 'Negative burn warning'}
          </span>
        </div>

        {/* Savings Rate Card (Monarch Signature Metric) */}
        <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">
              Monthly Savings Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#f4f4f5] tabular block">
            {savingsRate}%
          </span>
          <div className="w-full h-1.5 rounded-full bg-[#18181c] overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, savingsRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Cash Flow Breakdown Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expense Category Breakdown */}
        <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c1c22]">
            <div>
              <h3 className="font-semibold text-sm text-[#f4f4f5]">Where Did Your Money Go?</h3>
              <p className="text-[11px] text-[#71717a] mt-0.5">
                Click any category bar to inspect transactions
              </p>
            </div>
            <span className="text-xs font-semibold tabular text-[#f4f4f5]">
              Total: {formatAmount(expenses)}
            </span>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#71717a]">
              No expenses recorded yet in this cycle.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([category, amount]) => {
                const percent = totalCategorySpent > 0 ? Math.round((amount / totalCategorySpent) * 100) : 0;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      const catTxs = transactions.filter((t) => (t.category || 'Uncategorized') === category);
                      if (onOpenDrilldown) {
                        onOpenDrilldown(
                          `${category} Expenses`,
                          catTxs,
                          `${percent}% of monthly outflow • Total: ${formatAmount(amount)}`
                        );
                      } else {
                        onNavigateToTransactions({ category });
                      }
                    }}
                    className="w-full text-left group p-2 -mx-2 rounded-xl hover:bg-[#18181c] transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[#f4f4f5] group-hover:text-emerald-400 transition flex items-center gap-1.5">
                        <span>{category}</span>
                        <ChevronRight className="w-3 h-3 text-[#71717a] opacity-0 group-hover:opacity-100 transition" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#71717a]">{percent}%</span>
                        <span className="font-bold text-[#f4f4f5] tabular">{formatAmount(amount)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#18181c] overflow-hidden">
                      <div
                        className="h-full bg-neutral-200 group-hover:bg-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Income Sources & Cash Trajectory */}
        <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c1c22]">
            <div>
              <h3 className="font-semibold text-sm text-[#f4f4f5]">Inflow Sources & Velocity</h3>
              <p className="text-[11px] text-[#71717a] mt-0.5">
                Active deposits, payroll, and dividend inflows
              </p>
            </div>
            <span className="text-xs font-semibold tabular text-emerald-400">
              +{formatAmount(income)}
            </span>
          </div>

          {sortedIncomes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#71717a]">
              No income recorded yet in this cycle.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedIncomes.map(([source, amount]) => {
                const percent = income > 0 ? Math.round((amount / income) * 100) : 0;
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => {
                      const incTxs = transactions.filter(
                        (t) =>
                          t.type === 'INCOME' &&
                          (t.category === source ||
                            t.merchant === source ||
                            (!t.category && !t.merchant && source === 'General Income'))
                      );
                      if (onOpenDrilldown) {
                        onOpenDrilldown(
                          `${source} Inflow`,
                          incTxs,
                          `${percent}% of total inflow • Total: +${formatAmount(amount)}`
                        );
                      } else {
                        onNavigateToTransactions({ type: 'INCOME' });
                      }
                    }}
                    className="w-full text-left p-2 -mx-2 rounded-xl bg-[#16161a] hover:bg-[#1c1c22] border border-[#222228] transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[#f4f4f5] group-hover:text-emerald-400 transition">{source}</span>
                      <span className="font-bold text-emerald-400 tabular">+{formatAmount(amount)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#18181c] overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/80 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Financial Velocity Summary Box */}
          <div className="mt-4 p-4 rounded-xl bg-[#18181c] border border-[#26262e] space-y-2">
            <span className="text-xs font-semibold text-[#f4f4f5] block">
              30-Day Velocity Runway
            </span>
            <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
              Based on your current burn rate of <strong className="text-[#f4f4f5]">{formatAmount(avgDailySpend)}/day</strong>,
              you are projected to spend <strong className="text-[#f4f4f5]">{formatAmount(avgDailySpend * daysRemaining)}</strong> over
              the remaining {daysRemaining} days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
