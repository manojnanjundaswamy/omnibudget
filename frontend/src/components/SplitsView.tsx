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
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[#1c1c1c]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f4]">Peer Splits & IOUs</h2>
          <p className="text-xs text-[#9e9e98] mt-0.5">
            Graph debt-minimization engine • Split-to-Budget zero expense distortion
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:opacity-90 transition shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Settle Up Debt</span>
          </button>
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#181818] hover:bg-[#222222] text-[#f5f5f4] border border-[#242424] transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#9e9e98]" />
            <span>+ Log Split Bill</span>
          </button>
        </div>
      </div>

      {/* Split-to-Budget Invariant Note */}
      <div className="p-4 rounded-xl bg-[#121212] border border-[#242424] flex items-start gap-3 text-xs text-[#9e9e98]">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#f5f5f4] font-medium">Split-to-Budget Double-Entry Invariant:</strong> When you pay a $180 dinner for friends, your dining budget is charged only your personal share ($60). The remaining $120 is booked as a liquid Receivable IOU, keeping your monthly burn rate 100% accurate.
        </div>
      </div>

      {/* Groups & Debt Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Groups */}
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#242424] space-y-4">
          <h3 className="font-semibold text-[#f5f5f4] text-xs uppercase tracking-wider text-[#9e9e98]">
            Active Expense Groups
          </h3>

          <div className="space-y-3">
            {groups.map((grp) => (
              <div
                key={grp.id}
                className="p-4 rounded-xl bg-[#181818] border border-[#242424] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#f5f5f4] text-sm">{grp.name}</span>
                  <span className="text-xs font-bold tabular text-[#f5f5f4]">
                    {formatAmount(grp.totalExpenses)}
                  </span>
                </div>
                <p className="text-xs text-[#9e9e98]">{grp.description}</p>
                <div className="text-[11px] text-[#6b6b66] pt-1">
                  Members: <span className="text-[#9e9e98]">{grp.members}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debt Minimization Graph Output */}
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#242424] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[#9e9e98]">
              Simplified Debt Settlements
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181818] border border-[#2c2c2c] text-[#9e9e98]">
              O(V log V) Flow
            </span>
          </div>

          <div className="space-y-2">
            {simplified?.simplifiedPayments.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#242424] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#f5f5f4]">{item.fromUser}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6b6b66]" />
                  <span className="font-medium text-[#f5f5f4]">{item.toUser}</span>
                </div>

                <span className="font-bold text-emerald-400 tabular text-sm">
                  {formatAmount(item.amount)}
                </span>
              </div>
            ))}

            {(!simplified || simplified.simplifiedPayments.length === 0) && (
              <div className="p-6 text-center text-xs text-[#6b6b66]">
                All debts settled! No outstanding peer balances.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settle Up Modal */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <h3 className="font-semibold text-[#f5f5f4] text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Settle Up Peer Debt
              </h3>
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                className="text-[#9e9e98] hover:text-[#f5f5f4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettle} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9e9e98] mb-1 font-medium">Who is paying? (Debtor)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam"
                  value={settleFrom}
                  onChange={(e) => setSettleFrom(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2 text-[#f5f5f4]"
                />
              </div>

              <div>
                <label className="block text-[#9e9e98] mb-1 font-medium">Who receives? (Creditor)</label>
                <input
                  type="text"
                  required
                  value={settleTo}
                  onChange={(e) => setSettleTo(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2 text-[#f5f5f4]"
                />
              </div>

              <div>
                <label className="block text-[#9e9e98] mb-1 font-medium">Amount to Settle</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="120.00"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2 text-[#f5f5f4] font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block text-[#9e9e98] mb-1 font-medium">Deposit funds into account</label>
                <select
                  value={settleAccountId}
                  onChange={(e) => setSettleAccountId(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2 text-[#f5f5f4]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatAmount(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[#9e9e98] hover:text-[#f5f5f4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !settleFrom || !settleAmount}
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold disabled:opacity-50"
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
