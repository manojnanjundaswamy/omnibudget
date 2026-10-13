import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  BarChart3,
  LineChart,
} from 'lucide-react';
import { DashboardSummary, Transaction, TransactionFilter, TrendPoint } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { AnimatedAmount } from './AnimatedAmount';
import { api } from '../services/api';

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
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [activeTrendTab, setActiveTrendTab] = useState<'cashflow' | 'networth'>('cashflow');
  const [selectedMonth, setSelectedMonth] = useState<TrendPoint | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getMonthlyTrends(6)
      .then((data) => {
        if (mounted) {
          setTrends(data);
          if (data.length > 0) setSelectedMonth(data[data.length - 1]);
        }
      })
      .catch((e) => console.error('Failed to load monthly trends', e));
    return () => {
      mounted = false;
    };
  }, []);

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
  const avgDailySpend = currentDay > 0 ? expenses / currentDay : 0;

  // Find max value across trends for bar scaling
  const maxFlow = Math.max(
    ...trends.map((t) => Math.max(t.income, t.expenses)),
    5000
  );
  const minNetWorth = Math.min(...trends.map((t) => t.netWorth), 0);
  const maxNetWorth = Math.max(...trends.map((t) => t.netWorth), 100000);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--fg)]">Income & Spending Flow</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Cash flow velocity, multi-month trends, and net worth accumulation
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
          className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500/40 cursor-pointer transition space-y-2 group interactive-card"
          title="Click to drill down into income transactions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Total Inflow
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-emerald-400 tabular block">
            +<AnimatedAmount value={income} />
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
          className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-rose-500/40 cursor-pointer transition space-y-2 group interactive-card"
          title="Click to drill down into expense transactions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Total Outflow
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--fg)] tabular block">
            -<AnimatedAmount value={expenses} />
          </span>
          <span className="text-[11px] text-[var(--fg-muted)] block flex items-center justify-between">
            <span>About {formatAmount(avgDailySpend)} / day</span>
            <span className="text-[10px] text-rose-400 opacity-0 group-hover:opacity-100 transition">Drilldown →</span>
          </span>
        </div>

        {/* Net Savings Card */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2 interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
              Net Savings
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
            <AnimatedAmount value={netSaved} />
          </span>
          <span className="text-[11px] text-[var(--fg-muted)] block">
            {netSaved >= 0 ? 'You are saving money this month' : 'Spending more than earned'}
          </span>
        </div>

        {/* Savings Rate Card */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2 interactive-card">
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

      {/* 6-Month Historical Trend Analytics Section (Monarch Money / Mint Moat) */}
      {trends.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-5 shadow-sm">
          {/* Trend Section Header & Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="font-semibold text-sm text-[var(--fg)] tracking-tight">
                6-Month Financial Velocity & Wealth Trajectory
              </h3>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                Historical comparison of inflows, outflows, and compounding net worth
              </p>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTrendTab('cashflow')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTrendTab === 'cashflow'
                    ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm font-semibold'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Cash Flow (Inflow vs Outflow)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTrendTab('networth')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTrendTab === 'networth'
                    ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm font-semibold'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Net Worth Trend</span>
              </button>
            </div>
          </div>

          {/* Cash Flow Mode: Inflow vs Outflow Dual Bars */}
          {activeTrendTab === 'cashflow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] px-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                    <span>Inflow (Income)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-400 inline-block"></span>
                    <span>Outflow (Spending)</span>
                  </div>
                </div>
                {selectedMonth && (
                  <span className="font-medium text-[var(--fg)]">
                    {selectedMonth.month} Net: <strong className={selectedMonth.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {selectedMonth.netSavings >= 0 ? '+' : ''}{formatAmount(selectedMonth.netSavings)}
                    </strong> ({selectedMonth.savingsRate.toFixed(1)}% saved)
                  </span>
                )}
              </div>

              {/* Chart Bars Grid */}
              <div className="grid grid-cols-6 gap-2 sm:gap-4 h-56 items-end pt-4 pb-2 px-2 border-b border-[var(--border)]">
                {trends.map((pt) => {
                  const incomeHeight = Math.max(8, Math.round((pt.income / maxFlow) * 100));
                  const expenseHeight = Math.max(8, Math.round((pt.expenses / maxFlow) * 100));
                  const isSelected = selectedMonth?.monthKey === pt.monthKey;

                  return (
                    <div
                      key={pt.monthKey}
                      onClick={() => setSelectedMonth(pt)}
                      className={`h-full flex flex-col justify-end items-center gap-2 cursor-pointer p-1 rounded-xl transition ${
                        isSelected ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]/60'
                      }`}
                    >
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                        {/* Income Bar */}
                        <div
                          className="w-1/2 max-w-[18px] bg-emerald-500 rounded-t-md transition-all duration-500 hover:brightness-110"
                          style={{ height: `${incomeHeight}%` }}
                          title={`${pt.month} Income: +${formatAmount(pt.income)}`}
                        />
                        {/* Outlay Bar */}
                        <div
                          className="w-1/2 max-w-[18px] bg-rose-400 rounded-t-md transition-all duration-500 hover:brightness-110"
                          style={{ height: `${expenseHeight}%` }}
                          title={`${pt.month} Spending: -${formatAmount(pt.expenses)}`}
                        />
                      </div>
                      <span className={`text-[11px] font-semibold tabular ${isSelected ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'}`}>
                        {pt.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Net Worth Mode: Stepped Elevation & Accumulation */}
          {activeTrendTab === 'networth' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] px-1">
                <span>Monthly Net Worth Trajectory (Liquid + Invest - Debt)</span>
                {selectedMonth && (
                  <span className="font-bold text-[var(--fg)] tabular">
                    {selectedMonth.month} Valuation: {formatAmount(selectedMonth.netWorth)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-6 gap-2 sm:gap-4 h-56 items-end pt-4 pb-2 px-2 border-b border-[var(--border)]">
                {trends.map((pt, idx) => {
                  const range = Math.max(1, maxNetWorth - minNetWorth);
                  const normalized = Math.max(15, Math.round(((pt.netWorth - minNetWorth) / range) * 100));
                  const isSelected = selectedMonth?.monthKey === pt.monthKey;

                  return (
                    <div
                      key={pt.monthKey}
                      onClick={() => setSelectedMonth(pt)}
                      className={`h-full flex flex-col justify-end items-center gap-2 cursor-pointer p-1 rounded-xl transition ${
                        isSelected ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]/60'
                      }`}
                    >
                      <div className="w-full flex items-end justify-center h-44">
                        <div
                          className="w-full max-w-[34px] bg-gradient-to-t from-blue-500/20 to-blue-500 rounded-t-lg transition-all duration-500 hover:brightness-110 flex items-start justify-center pt-1"
                          style={{ height: `${normalized}%` }}
                          title={`${pt.month} Net Worth: ${formatAmount(pt.netWorth)}`}
                        >
                          <span className="text-[9px] font-bold text-white tabular hidden sm:block">
                            ${Math.round(pt.netWorth / 1000)}k
                          </span>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold tabular ${isSelected ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'}`}>
                        {pt.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
                    className="w-full text-left group p-2 -mx-2 rounded-xl hover:bg-[var(--surface-2)] transition interactive-row"
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

        {/* Income Sources Breakdown */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="font-semibold text-sm text-[var(--fg)]">Income Sources</h3>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                Deposits, payroll, dividends, and transfers
              </p>
            </div>
            <span className="text-xs font-semibold tabular text-emerald-400">
              Total: +{formatAmount(income)}
            </span>
          </div>

          {sortedIncomes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--fg-muted)]">
              No deposits recorded yet this month.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedIncomes.map(([source, amount]) => {
                const percent = income > 0 ? Math.round((amount / income) * 100) : 0;
                return (
                  <div
                    key={source}
                    className="p-2 -mx-2 rounded-xl hover:bg-[var(--surface-2)] transition interactive-row space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--fg)]">{source}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--fg-muted)]">{percent}%</span>
                        <span className="font-bold text-emerald-400 tabular">+{formatAmount(amount)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
