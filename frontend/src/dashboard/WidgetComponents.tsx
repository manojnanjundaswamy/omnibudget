import React from 'react';
import {
  DashboardSummary,
  Transaction,
  Account,
  BudgetEnvelope,
  Subscription,
  Household,
  SimplifiedDebtItem,
} from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { BarList, Progress, Badge } from './charts';
import { ArrowUpRight, ArrowDownLeft, Users2, ShieldCheck, Clock } from 'lucide-react';

interface WidgetContextProps {
  summary: DashboardSummary | null;
  transactions: Transaction[];
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  subscriptions: Subscription[];
  household: Household | null;
  simplifiedDebts: SimplifiedDebtItem[];
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
        <div className="text-3xl font-bold tracking-tight text-[#f5f5f4] tabular">
          {formatAmount(summary.safeToSpend)}
        </div>
        <p className="text-xs text-[#9e9e98] mt-1.5">
          about <strong className="text-[#f5f5f4] font-medium">{formatAmount(dailyPace)}</strong> a day for the next {daysLeft} days
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px] text-[#9e9e98]">
          <span>Spent {Math.round(spentRatio * 100)}% of income</span>
          <span>{Math.round(monthElapsedRatio * 100)}% of month gone</span>
        </div>
        <Progress value={spentRatio} color={spentRatio > 0.85 ? '#f59e0b' : '#10b981'} />
        <p className="text-[10px] text-[#6b6b66]">
          After committed envelopes and upcoming bills
        </p>
      </div>
    </div>
  );
};

export const SpendingByCategoryWidget: React.FC<WidgetContextProps> = ({ transactions }) => {
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
      <BarList items={items} format={formatAmount} />
    </div>
  );
};

export const CashFlowWidget: React.FC<WidgetContextProps> = ({ summary }) => {
  const { formatAmount } = useCurrency();
  if (!summary) return null;

  const netSavings = summary.totalIncomeThisMonth - summary.totalExpensesThisMonth;
  const isSurplus = netSavings >= 0;

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#181818] border border-[#242424]">
          <span className="text-[11px] text-[#9e9e98] block">Income</span>
          <span className="text-base font-bold text-emerald-400 tabular block mt-0.5">
            +{formatAmount(summary.totalIncomeThisMonth)}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#181818] border border-[#242424]">
          <span className="text-[11px] text-[#9e9e98] block">Outlays</span>
          <span className="text-base font-bold text-[#f5f5f4] tabular block mt-0.5">
            -{formatAmount(summary.totalExpensesThisMonth)}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex items-center justify-between text-xs">
        <span className="text-[#9e9e98]">Net Cash Flow:</span>
        <span className={`font-bold tabular ${isSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isSurplus ? '+' : ''}
          {formatAmount(netSavings)}
        </span>
      </div>
    </div>
  );
};

export const BudgetsWidget: React.FC<WidgetContextProps> = ({ envelopes }) => {
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
          <li key={env.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#f5f5f4] truncate max-w-[140px]">{env.name}</span>
              <div className="flex items-center gap-2">
                <span className="tabular text-[#9e9e98] text-[11px]">
                  {formatAmount(env.spentAmount)} <span className="text-[#6b6b66]">/ {formatAmount(env.monthlyBudget)}</span>
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

export const AccountsWidget: React.FC<WidgetContextProps> = ({ accounts }) => {
  const { formatAmount } = useCurrency();

  return (
    <ul className="flex flex-col gap-2">
      {accounts.slice(0, 4).map((acc) => (
        <li
          key={acc.id}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#181818] border border-[#242424] text-xs"
        >
          <div className="truncate pr-2">
            <span className="text-[#f5f5f4] font-medium block truncate">{acc.name}</span>
            <span className="text-[10px] text-[#6b6b66] font-mono">•••• {acc.accountNumberLast4 || '0000'}</span>
          </div>
          <span
            className={`font-semibold tabular shrink-0 ${
              acc.type === 'CREDIT_CARD' ? 'text-amber-400' : 'text-[#f5f5f4]'
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
      <div className="flex justify-between items-center text-xs pb-1 border-b border-[#242424]">
        <span className="text-[#9e9e98]">Owed to you:</span>
        <span className="text-emerald-400 font-bold tabular">
          {formatAmount(summary?.totalReceivablesIOU || 0)}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {simplifiedDebts.slice(0, 3).map((debt, i) => (
          <li
            key={i}
            className="flex items-center justify-between p-2 rounded-lg bg-[#181818] text-xs"
          >
            <div className="flex items-center gap-1.5 text-[11px] truncate text-[#9e9e98]">
              <span className="font-semibold text-[#f5f5f4]">{debt.fromUser}</span>
              <span>→</span>
              <span className="font-semibold text-[#f5f5f4]">{debt.toUser}</span>
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
        <span className="text-[#9e9e98]">Joint Pool Reserve:</span>
        <span className="text-base font-bold text-emerald-400 tabular">
          {formatAmount(household.jointPoolBalance)}
        </span>
      </div>

      <div className="p-2.5 rounded-xl bg-[#181818] border border-[#242424] space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-[#9e9e98]">{household.partnerAName}:</span>
          <span className="font-medium text-[#f5f5f4]">{(household.partnerARatio * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-[#9e9e98]">{household.partnerBName}:</span>
          <span className="font-medium text-[#f5f5f4]">{(household.partnerBRatio * 100).toFixed(0)}%</span>
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
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#181818] border border-[#242424] text-xs"
        >
          <div className="truncate pr-2">
            <span className="text-[#f5f5f4] font-medium block truncate">{sub.name}</span>
            <span className="text-[10px] text-[#6b6b66] flex items-center gap-1">
              <Clock className="w-3 h-3" /> Due {sub.nextBillingDate}
            </span>
          </div>
          <span className="font-semibold tabular text-[#f5f5f4] shrink-0">
            {formatAmount(sub.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const RecentTransactionsWidget: React.FC<WidgetContextProps> = ({ transactions }) => {
  const { formatAmount } = useCurrency();

  return (
    <div className="divide-y divide-[#1e1e1e]">
      {transactions.slice(0, 6).map((tx) => {
        const isIncome = tx.amount > 0;
        const isSplit = tx.receivableAmount > 0;

        return (
          <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-3 truncate">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isIncome
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : isSplit
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'bg-[#1c1c1c] text-[#9e9e98]'
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
                  <span className="font-medium text-[#f5f5f4] truncate">
                    {tx.merchant || tx.description || 'Transaction'}
                  </span>
                  {isSplit && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                      Split
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#6b6b66] block">{tx.category} • {tx.date}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`font-semibold tabular text-xs ${
                  isIncome ? 'text-emerald-400' : 'text-[#f5f5f4]'
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
