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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--fg)]">Income & Spending</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Money coming in, money going out, and what you keep this month
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--fg-muted)]">
          <Calendar className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
          <span>This month (Day {currentDay} of {daysInMonth})</span>
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
          className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500/40 cursor-pointer transition space-y-2 group"
          title="Click to drill down into income transactions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Total Income
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-emerald-400 tabular block">
            +{formatAmount(income)}
          </span>
          <span className="text-[11px] text-[var(--fg-muted)] block flex items-center justify-between">
            <span>{sortedIncomes.length} income deposits</span>
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
          className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-rose-500/40 cursor-pointer transition space-y-2 group"
          title="Click to drill down into expense transactions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Total Spending
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--fg)] tabular block">
            -{formatAmount(expenses)}
          </span>
          <span className="text-[11px] text-[var(--fg-muted)] block flex items-center justify-between">
            <span>About {formatAmount(avgDailySpend)} / day</span>
            <span className="text-[10px] text-rose-400 opacity-0 group-hover:opacity-100 transition">Drilldown →</span>
          </span>
        </div>

        {/* Net Savings Card */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Net Saved
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
          <span className="text-[11px] text-[var(--fg-muted)] block">
            {netSaved >= 0 ? 'You are saving money this month' : 'Spending more than earned'}
          </span>
        </div>

        {/* Savings Rate Card */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Savings Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--fg)] tabular block">
            {savingsRate}%
          </span>
          <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden mt-1">
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
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="font-semibold text-sm text-[var(--fg)]">Where Your Money Went</h3>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                Click any category bar to inspect transactions
              </p>
            </div>
            <span className="text-xs font-semibold tabular text-[var(--fg)]">
              Total: {formatAmount(expenses)}
            </span>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--fg-muted)]">
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
                    className="w-full text-left group p-2 -mx-2 rounded-xl hover:bg-[var(--surface-2)] transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[var(--fg)] group-hover:text-emerald-400 transition flex items-center gap-1.5">
                        <span>{category}</span>
                        <ChevronRight className="w-3 h-3 text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 transition" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--fg-muted)]">{percent}%</span>
                        <span className="font-bold text-[var(--fg)] tabular">{formatAmount(amount)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className="h-full bg-neutral-400 group-hover:bg-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Income Sources */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="font-semibold text-sm text-[var(--fg)]">Income Sources</h3>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                Active deposits, salary, and earnings
              </p>
            </div>
            <span className="text-xs font-semibold tabular text-emerald-400">
              +{formatAmount(income)}
            </span>
          </div>

          {sortedIncomes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--fg-muted)]">
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
                    className="w-full text-left p-2 -mx-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[var(--fg)] group-hover:text-emerald-400 transition">{source}</span>
                      <span className="font-bold text-emerald-400 tabular">+{formatAmount(amount)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
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

          {/* Month Outlook Summary Box */}
          <div className="mt-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
            <span className="text-xs font-semibold text-[var(--fg)] block">
              Month Outlook
            </span>
            <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
              At your current spending pace of <strong className="text-[var(--fg)]">{formatAmount(avgDailySpend)}/day</strong>,
              you are on track to spend <strong className="text-[var(--fg)]">{formatAmount(avgDailySpend * daysRemaining)}</strong> over
              the remaining {daysRemaining} days of this month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
