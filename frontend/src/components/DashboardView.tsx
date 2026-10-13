import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Users2,
  Sparkles,
  Plus,
  RefreshCw,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import { DashboardSummary, Transaction, Account } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  transactions: Transaction[];
  accounts: Account[];
  onOpenQuickCapture: () => void;
  onSimulatePaycheck: () => void;
  onSimulateExpense: () => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  transactions,
  accounts,
  onOpenQuickCapture,
  onSimulatePaycheck,
  onSimulateExpense,
  onRefresh,
}) => {
  const { formatAmount } = useCurrency();

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading cockpit ledger...
      </div>
    );
  }

  // Chart data: Net Worth composition
  const netWorthData = [
    { name: 'Liquid Cash', value: summary.totalLiquidAssets, color: '#10b981' },
    { name: 'Investments', value: summary.totalInvestments, color: '#6366f1' },
    { name: 'Credit Debt', value: summary.totalCreditLiabilities, color: '#f43f5e' },
  ];

  // Spending vs Income this month
  const cashFlowData = [
    { name: 'Income', amount: summary.totalIncomeThisMonth, fill: '#10b981' },
    { name: 'Expenses', amount: summary.totalExpensesThisMonth, fill: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Financial Cockpit</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-ledger balancing • Double-entry immutable accounting
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </button>
          <button
            onClick={onSimulatePaycheck}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition"
            title="Simulate $4,500 salary arrival"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Simulate Paycheck</span>
          </button>
          <button
            onClick={onSimulateExpense}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Simulate card swipe"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Net Worth */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Consolidated Net Worth</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-100 tracking-tight">
            {formatAmount(summary.netWorth)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span>Assets: {formatAmount(summary.totalLiquidAssets + summary.totalInvestments)}</span>
            <span>•</span>
            <span className="text-rose-400">Liab: {formatAmount(summary.totalCreditLiabilities)}</span>
          </div>
        </div>

        {/* 2. Safe-to-Spend */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-400">Safe-to-Spend</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {formatAmount(summary.safeToSpend)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Liquid cash minus remaining committed envelope obligations
          </p>
        </div>

        {/* 3. Monthly Cash Flow & Burn Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">This Month's In/Out</span>
            <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-emerald-400 font-bold text-lg">
              +{formatAmount(summary.totalIncomeThisMonth)}
            </span>
            <span className="text-slate-500 font-light">/</span>
            <span className="text-rose-400 font-bold text-lg">
              -{formatAmount(summary.totalExpensesThisMonth)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Net Savings:{' '}
            <strong className="text-slate-200">
              {formatAmount(summary.totalIncomeThisMonth - summary.totalExpensesThisMonth)}
            </strong>
          </div>
        </div>

        {/* 4. Peer Group IOUs (Splitwise Engine) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Peer Debts & IOUs</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Users2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span className="text-slate-400 text-xs">Owed to you:</span>
            <span className="text-emerald-400 font-bold">{formatAmount(summary.totalReceivablesIOU)}</span>
          </div>
          <div className="text-sm font-semibold text-slate-200 flex items-center justify-between mt-1.5">
            <span className="text-slate-400 text-xs">You owe others:</span>
            <span className="text-rose-400 font-bold">{formatAmount(summary.totalPayablesIOU)}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Protected by Split-to-Budget Invariant</p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cash Flow In vs Out */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Cash Flow Inflow vs Outflow
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => formatAmount(Number(val))}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {cashFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Worth Asset Allocation */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Asset & Debt Composition
          </h3>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={netWorthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {netWorthData.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatAmount(Number(val))}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[11px] text-slate-400 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Liquid
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> Invest
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Credit
            </span>
          </div>
        </div>

        {/* Quick Accounts Snapshot */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Banking Accounts
            </h3>
            <span className="text-xs text-indigo-400 font-semibold">{accounts.length} linked</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-48 pr-1">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow"
                    style={{ backgroundColor: acc.color || '#4f46e5' }}
                  >
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block truncate max-w-[130px]">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ••• {acc.accountNumberLast4 || '0000'}
                    </span>
                  </div>
                </div>
                <div
                  className={`text-xs font-bold ${
                    acc.type === 'CREDIT_CARD' ? 'text-amber-400' : 'text-slate-100'
                  }`}
                >
                  {formatAmount(acc.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Live Double-Entry Activity Ledger</h3>
            <p className="text-xs text-slate-400">Recent personal outlays, salary credits, and group expense splits</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {transactions.slice(0, 8).map((tx) => {
            const isIncome = tx.amount > 0;
            const hasSplit = tx.receivableAmount > 0;

            return (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : hasSplit
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : hasSplit ? (
                      <Users2 className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-xs">
                        {tx.merchant || tx.description || 'Transaction'}
                      </span>
                      {hasSplit && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Group Split
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {tx.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{tx.accountName}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                      {tx.envelopeName && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">Envelope: {tx.envelopeName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold text-sm ${
                      isIncome ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {isIncome ? '+' : ''}
                    {formatAmount(tx.amount)}
                  </div>
                  {hasSplit && (
                    <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                      Your share: {formatAmount(tx.netPersonalAmount)} • IOU: +{formatAmount(tx.receivableAmount)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
