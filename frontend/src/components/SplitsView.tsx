import React, { useState, useEffect } from 'react';
import {
  Users2,
  GitMerge,
  ArrowRight,
  CheckCircle,
  Plus,
  ShieldCheck,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Split Expenses</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Split bills with friends and keep balances square without messing up your personal budget.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettleModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Settle Up</span>
          </button>
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] transition"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
            <span>+ Add Split Bill</span>
          </button>
        </div>
      </div>

      {/* Split Invariant Note */}
      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3 text-xs text-[var(--fg-muted)]">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[var(--fg)] font-medium">How splits work:</strong> When you pay a $180 dinner for friends, only your personal share ($60) counts as your expense. The remaining $120 is tracked as an IOU until they pay you back.
        </div>
      </div>

      {/* Groups & Debt Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Groups */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-[var(--fg-muted)]">
            Active Groups
          </h3>

          <div className="space-y-3">
            {groups.map((grp) => (
              <div
                key={grp.id}
                className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--fg)] text-sm">{grp.name}</span>
                  <span className="text-xs font-bold tabular text-[var(--fg)]">
                    {formatAmount(grp.totalExpenses)}
                  </span>
                </div>
                <p className="text-xs text-[var(--fg-muted)]">{grp.description}</p>
                <div className="text-[11px] text-[var(--fg-muted)] pt-1">
                  Members: <span className="text-[var(--fg)]">{grp.members}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debt Settlements */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[var(--fg-muted)]">
              Who Owes Who
            </h3>
          </div>

          <div className="space-y-2">
            {simplified?.simplifiedPayments.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--fg)]">{item.fromUser}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                  <span className="font-medium text-[var(--fg)]">{item.toUser}</span>
                </div>

                <span className="font-bold text-emerald-500 tabular text-sm">
                  {formatAmount(item.amount)}
                </span>
              </div>
            ))}

            {(!simplified || simplified.simplifiedPayments.length === 0) && (
              <div className="p-6 text-center text-xs text-[var(--fg-muted)]">
                All settled! No outstanding balances.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settle Up Modal */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-semibold text-[var(--fg)] text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Settle Up
              </h3>
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettle} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--fg-muted)] mb-1 font-medium">Who paid?</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam"
                  value={settleFrom}
                  onChange={(e) => setSettleFrom(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[var(--fg-muted)] mb-1 font-medium">Who received?</label>
                <input
                  type="text"
                  required
                  value={settleTo}
                  onChange={(e) => setSettleTo(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[var(--fg-muted)] mb-1 font-medium">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="120.00"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] font-semibold text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[var(--fg-muted)] mb-1 font-medium">Deposit funds into account</label>
                <select
                  value={settleAccountId}
                  onChange={(e) => setSettleAccountId(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatAmount(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !settleFrom || !settleAmount}
                  className="px-4 py-2 rounded-lg bg-[var(--fg)] text-[var(--bg)] font-semibold hover:opacity-90 disabled:opacity-50 transition"
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
