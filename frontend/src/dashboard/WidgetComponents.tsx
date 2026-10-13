import React from 'react';
import {
  DashboardSummary,
  Transaction,
  Account,
  BudgetEnvelope,
  Subscription,
  Household,
  SimplifiedDebtItem,
  Goal,
} from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { AnimatedAmount } from '../components/AnimatedAmount';
import { BarList, Progress, Badge } from './charts';
import { ArrowUpRight, ArrowDownLeft, Users2, ShieldCheck, Clock, Trophy } from 'lucide-react';

interface WidgetContextProps {
  summary: DashboardSummary | null;
  transactions: Transaction[];
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  subscriptions: Subscription[];
  household: Household | null;
  simplifiedDebts: SimplifiedDebtItem[];
  goals?: Goal[];
  onNavigateToTransactions?: (filter?: { accountId?: string; category?: string; envelopeId?: string }) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onOpenDrilldown?: (title: string, transactions: Transaction[], subtitle?: string) => void;
}

export const SafeToSpendWidget: React.FC<WidgetContextProps> = ({ summary }) => {
  const { formatAmount } = useCurrency();
  if (!summary) return null;

  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, lastDayOfMonth - today.getDate());
  const dailyPace = summary.safeToSpend / daysLeft;

  const income = summary.totalIncomeThisMonth || 1;
  const spentRatio = Math.min(1, summary.totalExpensesThisMonth / income);
  const monthElapsedRatio = Math.min(1, today.getDate() / lastDayOfMonth);

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div>
        <div className="text-3xl font-bold tracking-tight text-[var(--fg)] tabular">
          <AnimatedAmount value={summary.safeToSpend} />
        </div>
        <p className="text-xs text-[var(--fg-muted)] mt-1.5">
          about <strong className="text-[var(--fg)] font-medium">{formatAmount(dailyPace)}</strong> a day for the next {daysLeft} days
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px] text-[var(--fg-muted)]">
          <span>Spent {Math.round(spentRatio * 100)}% of income</span>
          <span>{Math.round(monthElapsedRatio * 100)}% of month gone</span>
        </div>
        <Progress value={spentRatio} color={spentRatio > 0.85 ? '#f59e0b' : '#10b981'} />
        <p className="text-[10px] text-[var(--fg-subtle)]">
          After committed envelopes and upcoming bills
        </p>
      </div>
    </div>
  );
};

export const SpendingByCategoryWidget: React.FC<WidgetContextProps> = ({
  transactions,
  onNavigateToTransactions,
  onOpenDrilldown,
}) => {
  const { formatAmount } = useCurrency();

  // Aggregate expenses by category
  const categoryMap: Record<string, number> = {};
  transactions
    .filter((tx) => tx.amount < 0)
    .forEach((tx) => {
      const cat = tx.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(tx.netPersonalAmount || tx.amount);
    });

  const items = Object.entries(categoryMap)
    .map(([cat, val]) => ({ key: cat, label: cat, value: val }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-3">
      <BarList
        items={items}
        format={formatAmount}
        onSelect={(item) => {
          if (onOpenDrilldown) {
            const catTxs = transactions.filter((t) => (t.category || 'Other') === item.key);
            onOpenDrilldown(`${item.label} Spending`, catTxs, `Total: ${formatAmount(item.value)}`);
          } else {
            onNavigateToTransactions?.({ category: item.key });
          }
        }}
      />
    </div>
  );
};

export const CashFlowWidget: React.FC<WidgetContextProps> = ({ summary, transactions, onNavigateToTransactions, onOpenDrilldown }) => {
  const { formatAmount } = useCurrency();
  if (!summary) return null;

  const netSavings = summary.totalIncomeThisMonth - summary.totalExpensesThisMonth;
  const isSurplus = netSavings >= 0;

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => {
            if (onOpenDrilldown) {
              const incTxs = transactions.filter((t) => t.type === 'INCOME');
              onOpenDrilldown('Monthly Inflow & Income', incTxs, `Total: +${formatAmount(summary.totalIncomeThisMonth)}`);
            } else {
              onNavigateToTransactions?.();
            }
          }}
          className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-emerald-500/40 cursor-pointer transition group interactive-card"
        >
          <span className="text-[11px] text-[var(--fg-muted)] block">Income</span>
          <span className="text-base font-bold text-emerald-400 tabular block mt-0.5">
            +<AnimatedAmount value={summary.totalIncomeThisMonth} />
          </span>
        </div>
        <div
          onClick={() => {
            if (onOpenDrilldown) {
              const expTxs = transactions.filter((t) => t.type === 'EXPENSE');
              onOpenDrilldown('Monthly Outlays & Expenses', expTxs, `Total: -${formatAmount(summary.totalExpensesThisMonth)}`);
            } else {
              onNavigateToTransactions?.();
            }
          }}
          className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-rose-500/40 cursor-pointer transition group interactive-card"
        >
          <span className="text-[11px] text-[var(--fg-muted)] block">Outlays</span>
          <span className="text-base font-bold text-[var(--fg)] tabular block mt-0.5">
            -<AnimatedAmount value={summary.totalExpensesThisMonth} />
          </span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs interactive-card">
        <span className="text-[var(--fg-muted)]">Net Cash Flow:</span>
        <span className={`font-bold tabular ${isSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isSurplus ? '+' : ''}
          <AnimatedAmount value={netSavings} />
        </span>
      </div>
    </div>
  );
};

export const BudgetsWidget: React.FC<WidgetContextProps> = ({ envelopes, transactions, onNavigateToTransactions, onOpenDrilldown }) => {
  const { formatAmount } = useCurrency();

  const sorted = [...envelopes]
    .sort((a, b) => b.spentAmount / Math.max(1, b.monthlyBudget) - a.spentAmount / Math.max(1, a.monthlyBudget))
    .slice(0, 4);

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((env) => {
        const ratio = env.monthlyBudget > 0 ? env.spentAmount / env.monthlyBudget : 0;
        const isOver = ratio > 1;
        const isWarning = ratio > 0.8 && !isOver;

        return (
          <li
            key={env.id}
            onClick={() => {
              if (onOpenDrilldown) {
                const catTxs = transactions.filter((t) => t.envelopeId === env.id || (t.category && t.category.toLowerCase() === env.name.toLowerCase()));
                onOpenDrilldown(`${env.name} Budget Drilldown`, catTxs, `Target: ${formatAmount(env.monthlyBudget)} • Spent: ${formatAmount(env.spentAmount)}`);
              } else {
                onNavigateToTransactions?.({ envelopeId: env.id, category: env.name });
              }
            }}
            className="space-y-1 cursor-pointer hover:opacity-85 transition group p-1.5 rounded-lg interactive-row"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--fg)] truncate max-w-[140px] transition">
                {env.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="tabular text-[var(--fg-muted)] text-[11px]">
                  {formatAmount(env.spentAmount)} <span className="text-[var(--fg-subtle)]">/ {formatAmount(env.monthlyBudget)}</span>
                </span>
                {isOver ? (
                  <Badge tone="critical">Over</Badge>
                ) : isWarning ? (
                  <Badge tone="warning">80%</Badge>
                ) : (
                  <Badge tone="good">On Track</Badge>
                )}
              </div>
            </div>
            <Progress
              value={ratio}
              color={isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}
            />
          </li>
        );
      })}
    </ul>
  );
};

export const AccountsWidget: React.FC<WidgetContextProps> = ({ accounts, transactions, onNavigateToTransactions, onOpenDrilldown }) => {
  const { formatAmount } = useCurrency();

  return (
    <ul className="flex flex-col gap-2">
      {accounts.slice(0, 4).map((acc) => (
        <li
          key={acc.id}
          onClick={() => {
            if (onOpenDrilldown) {
              const accTxs = transactions.filter((t) => t.accountId === acc.id);
              onOpenDrilldown(`${acc.name} Activity`, accTxs, `Balance: ${formatAmount(acc.balance)}`);
            } else {
              onNavigateToTransactions?.({ accountId: acc.id });
            }
          }}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs cursor-pointer hover:border-[var(--border-strong)] transition group interactive-card"
        >
          <div className="truncate pr-2">
            <span className="text-[var(--fg)] font-medium block truncate transition">{acc.name}</span>
            <span className="text-[10px] text-[var(--fg-subtle)] font-mono">•••• {acc.accountNumberLast4 || '0000'}</span>
          </div>
          <span
            className={`font-semibold tabular shrink-0 ${
              acc.type === 'CREDIT_CARD' ? 'text-amber-400' : 'text-[var(--fg)]'
            }`}
          >
            {formatAmount(acc.balance)}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const PeerDebtsWidget: React.FC<WidgetContextProps> = ({ simplifiedDebts, summary }) => {
  const { formatAmount } = useCurrency();

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs pb-1 border-b border-[var(--border)]">
        <span className="text-[var(--fg-muted)]">Owed to you:</span>
        <span className="text-emerald-400 font-bold tabular">
          {formatAmount(summary?.totalReceivablesIOU || 0)}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {simplifiedDebts.slice(0, 3).map((debt, i) => (
          <li
            key={i}
            className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)] text-xs"
          >
            <div className="flex items-center gap-1.5 text-[11px] truncate text-[var(--fg-muted)]">
              <span className="font-semibold text-[var(--fg)]">{debt.fromUser}</span>
              <span>→</span>
              <span className="font-semibold text-[var(--fg)]">{debt.toUser}</span>
            </div>
            <span className="font-bold text-emerald-400 tabular text-xs">
              {formatAmount(debt.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const HouseholdWidget: React.FC<WidgetContextProps> = ({ household }) => {
  const { formatAmount } = useCurrency();
  if (!household) return null;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex justify-between items-center">
        <span className="text-[var(--fg-muted)]">Joint Pool Reserve:</span>
        <span className="text-base font-bold text-emerald-400 tabular">
          {formatAmount(household.jointPoolBalance)}
        </span>
      </div>

      <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-[var(--fg-muted)]">{household.partnerAName}:</span>
          <span className="font-medium text-[var(--fg)]">{(household.partnerARatio * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-[var(--fg-muted)]">{household.partnerBName}:</span>
          <span className="font-medium text-[var(--fg)]">{(household.partnerBRatio * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

export const BillsRadarWidget: React.FC<WidgetContextProps> = ({ subscriptions }) => {
  const { formatAmount } = useCurrency();

  return (
    <ul className="flex flex-col gap-2">
      {subscriptions.slice(0, 3).map((sub) => (
        <li
          key={sub.id}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs interactive-card"
        >
          <div className="truncate pr-2">
            <span className="text-[var(--fg)] font-medium block truncate">{sub.name}</span>
            <span className="text-[10px] text-[var(--fg-subtle)] flex items-center gap-1">
              <Clock className="w-3 h-3" /> Due {sub.nextBillingDate}
            </span>
          </div>
          <span className="font-semibold tabular text-[var(--fg)] shrink-0">
            {formatAmount(sub.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const RecentTransactionsWidget: React.FC<WidgetContextProps> = ({ transactions, onEditTransaction }) => {
  const { formatAmount } = useCurrency();

  return (
    <div className="divide-y divide-[var(--border)]">
      {transactions.slice(0, 6).map((tx) => {
        const isIncome = tx.amount > 0;
        const isSplit = tx.receivableAmount > 0;

        return (
          <div
            key={tx.id}
            onClick={() => onEditTransaction?.(tx)}
            className="py-2.5 flex items-center justify-between text-xs gap-3 cursor-pointer hover:bg-[var(--surface-2)] -mx-2 px-2 rounded-lg transition group interactive-row"
          >
            <div className="flex items-center gap-3 truncate">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isIncome
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : isSplit
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'bg-[var(--surface-2)] text-[var(--fg-muted)]'
                }`}
              >
                {isIncome ? (
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                ) : isSplit ? (
                  <Users2 className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--fg)] truncate">
                    {tx.merchant || tx.description || 'Transaction'}
                  </span>
                  {isSplit && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                      Split
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--fg-subtle)] block">{tx.category} • {tx.date}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`font-semibold tabular text-xs ${
                  isIncome ? 'text-emerald-400' : 'text-[var(--fg)]'
                }`}
              >
                {isIncome ? '+' : ''}
                {formatAmount(tx.amount)}
              </span>
              {isSplit && (
                <span className="text-[10px] text-emerald-400 block tabular">
                  IOU: +{formatAmount(tx.receivableAmount)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const GoalsWidget: React.FC<WidgetContextProps> = ({ goals = [] }) => {
  const { formatAmount } = useCurrency();

  if (goals.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[var(--fg-muted)]">
        No active financial milestones
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {goals.slice(0, 3).map((goal) => {
        const progress =
          goal.targetAmount > 0
            ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
            : 0;

        return (
          <div key={goal.id} className="space-y-1.5 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] interactive-card">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--fg)] truncate">{goal.name}</span>
              <span className="font-bold tabular text-emerald-400">{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: goal.color || '#10b981' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--fg-muted)]">
              <span>{formatAmount(goal.currentAmount)} saved</span>
              <span>Target: {formatAmount(goal.targetAmount)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
