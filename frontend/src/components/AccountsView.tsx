import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  CreditCard,
  TrendingUp,
  ArrowRightLeft,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Upload,
} from 'lucide-react';
import { Account } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface AccountsViewProps {
  accounts: Account[];
  onRefresh: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onRefresh }) => {
  const { formatAmount } = useCurrency();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Transfer form state
  const [sourceId, setSourceId] = useState(accounts[0]?.id || '');
  const [targetId, setTargetId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || !transferAmount) return;

    try {
      setIsSubmitting(true);
      await api.transferFunds({
        sourceAccountId: sourceId,
        targetAccountId: targetId,
        amount: parseFloat(transferAmount),
        description: transferDesc || 'Internal account transfer',
      });
      setIsTransferModalOpen(false);
      setTransferAmount('');
      setTransferDesc('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Banking & Accounts</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Liquid accounts, credit liability guardrails, and investment vaults
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Funds</span>
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const isCredit = acc.type === 'CREDIT_CARD';
          const isSavings = acc.type === 'SAVINGS';
          const isInvestment = acc.type === 'INVESTMENT';

          return (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/90 shadow-xl relative overflow-hidden group hover:border-slate-700 transition"
            >
              {/* Card top row */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {acc.institutionName || 'Financial Institution'}
                  </span>
                  <h3 className="font-bold text-slate-100 text-base mt-0.5 truncate max-w-[200px]">
                    {acc.name}
                  </h3>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow"
                  style={{ backgroundColor: acc.color || '#6366f1' }}
                >
                  {isCredit ? (
                    <CreditCard className="w-4 h-4" />
                  ) : isInvestment ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : isSavings ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <Wallet className="w-4 h-4" />
                  )}
                </div>
              </div>

              {/* Balance */}
              <div className="mt-5">
                <span className="text-slate-400 text-xs block">
                  {isCredit ? 'Outstanding Balance' : 'Available Balance'}
                </span>
                <div
                  className={`text-2xl font-black tracking-tight mt-0.5 ${
                    isCredit ? 'text-amber-400' : 'text-slate-100'
                  }`}
                >
                  {formatAmount(acc.balance)}
                </div>
              </div>

              {/* Special details for Credit Cards */}
              {isCredit && acc.creditLimit && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between text-[11px]">
                    <span>Credit Limit: {formatAmount(acc.creditLimit)}</span>
                    <span className="text-emerald-400">
                      Available: {formatAmount(acc.creditLimit - Math.abs(acc.balance))}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (Math.abs(acc.balance) / acc.creditLimit) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>Due Day: {acc.paymentDueDay}th of month</span>
                    <span>APR: {acc.apr}%</span>
                  </div>
                </div>
              )}

              {/* Card Bottom Digits */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>STATUS: ACTIVE</span>
                <span>•••• {acc.accountNumberLast4 || '4182'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Funds Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" /> Transfer Funds
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Source Account (Debit)</label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatAmount(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Account (Credit)</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === sourceId}>
                      {acc.name} ({formatAmount(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Transfer Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="500.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Note / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly emergency savings fund sweep"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !transferAmount}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Statement Importer Simulation Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Statement CSV Importer
              </h3>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center space-y-3 bg-slate-900/50">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Drag & Drop bank statement (CSV, OFX, QIF)
                </span>
                <span className="text-[11px] text-slate-500">Supported by Chase, Amex, Wells Fargo, HDFC, Barclays</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  alert('Sample statement parsed! 14 transactions mapped with duplicate detection.');
                  setIsCsvModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                Upload Demo Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
