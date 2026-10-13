import React, { useState, useEffect } from 'react';
import {
  Users2,
  GitMerge,
  ArrowRight,
  CheckCircle,
  Plus,
  ShieldCheck,
  Building2,
  DollarSign,
  X,
} from 'lucide-react';
import { SplitGroup, PeerDebt, DebtSimplificationResponse, Account } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface SplitsViewProps {
  groups: SplitGroup[];
  accounts: Account[];
  onRefresh: () => void;
  onOpenQuickCapture: () => void;
}

export const SplitsView: React.FC<SplitsViewProps> = ({
  groups,
  accounts,
  onRefresh,
  onOpenQuickCapture,
}) => {
  const { formatAmount } = useCurrency();
  const [debts, setDebts] = useState<PeerDebt[]>([]);
  const [simplified, setSimplified] = useState<DebtSimplificationResponse | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('You');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleAccountId, setSettleAccountId] = useState(accounts[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDebts();
  }, [groups]);

  const loadDebts = async () => {
    try {
      const allDebts = await api.getPeerDebts();
      setDebts(allDebts);
      const simp = await api.getSimplifiedDebts();
      setSimplified(simp);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleFrom || !settleTo || !settleAmount) return;

    try {
      setIsSubmitting(true);
      await api.settleDebt({
        fromUser: settleFrom,
        toUser: settleTo,
        amount: parseFloat(settleAmount),
        targetAccountId: settleAccountId,
      });
      setIsSettleModalOpen(false);
      setSettleAmount('');
      loadDebts();
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Peer Splits & IOUs</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Splitwise Paradigm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Graph debt-minimization engine • Split-to-Budget zero distortion guarantee
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSettleModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Settle Up Debt</span>
          </button>
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Split Bill</span>
          </button>
        </div>
      </div>

      {/* The Split-to-Budget Invariant Highlight */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3.5 text-xs text-indigo-200">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-indigo-300 text-sm">The "Split-to-Budget" Accounting Invariant</span>
          <p className="text-slate-300 mt-1 leading-relaxed">
            When you pay a <strong>$180</strong> dinner bill for 3 friends, traditional budgeting apps mistakenly report that you blew $180 of your personal dining budget. OmniBudget records strictly your personal consumption (<strong>$60</strong>) into your dining envelope, and books the remaining <strong>$120</strong> as a liquid Receivable IOU asset. Your personal monthly burn rate remains 100% accurate!
          </p>
        </div>
      </div>

      {/* Groups & Debt Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Groups */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Users2 className="w-4 h-4 text-indigo-400" /> Active Expense Groups
          </h3>

          <div className="space-y-3">
            {groups.map((grp) => (
              <div
                key={grp.id}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm">{grp.name}</span>
                  <span className="text-xs font-bold text-slate-300">
                    Total: {formatAmount(grp.totalExpenses)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{grp.description}</p>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                  <span>Members:</span>
                  <span className="text-slate-300 font-medium">{grp.members}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debt Minimization Graph Output */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-emerald-400" /> Simplified Debt Settlement Graph
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              O(V log V) Minimum Flow
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Circular debts are collapsed into the minimum required transfers:
          </p>

          <div className="space-y-2.5">
            {simplified?.simplifiedPayments.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80"
              >
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-100 px-2 py-1 rounded bg-slate-700">
                    {item.fromUser}
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-100 px-2 py-1 rounded bg-slate-700">
                    {item.toUser}
                  </span>
                </div>

                <div className="font-black text-sm text-emerald-400">
                  {formatAmount(item.amount)}
                </div>
              </div>
            ))}

            {(!simplified || simplified.simplifiedPayments.length === 0) && (
              <div className="p-6 text-center text-xs text-slate-500">
                All debts settled! No outstanding peer balances.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settle Up Modal */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Settle Up Peer Debt
              </h3>
              <button
                onClick={() => setIsSettleModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Who is paying? (Debtor)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam or Emma"
                  value={settleFrom}
                  onChange={(e) => setSettleFrom(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Who receives? (Creditor)</label>
                <input
                  type="text"
                  required
                  value={settleTo}
                  onChange={(e) => setSettleTo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Amount to Settle</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="120.00"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Deposit funds into account</label>
                <select
                  value={settleAccountId}
                  onChange={(e) => setSettleAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatAmount(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !settleFrom || !settleAmount}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
