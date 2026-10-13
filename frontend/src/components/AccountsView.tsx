import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  CreditCard,
  TrendingUp,
  ArrowRightLeft,
  FileSpreadsheet,
  X,
  Upload,
  Sparkles,
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface AccountsViewProps {
  accounts: Account[];
  transactions?: Transaction[];
  onRefresh: () => void;
  onOpenAddAccount: () => void;
  onEditAccount: (account: Account) => void;
  onNavigateToTransactions: (filter?: { accountId?: string }) => void;
  onOpenDrilldown?: (title: string, transactions: Transaction[], subtitle?: string) => void;
  onOpenSmartIngest?: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions = [],
  onRefresh,
  onOpenAddAccount,
  onEditAccount,
  onNavigateToTransactions,
  onOpenDrilldown,
  onOpenSmartIngest,
}) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Accounts</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Every bank account, credit card, and cash stash in one place
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddAccount}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] transition shadow-sm"
          >
            <span>+ Add Account</span>
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
            <span>Transfer Funds</span>
          </button>
          {onOpenSmartIngest ? (
            <button
              onClick={onOpenSmartIngest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition shadow-sm"
              title="Bank statement drop, OFX/QFX parser, or SMS smart clip"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Smart Ingest</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
              <span>Import CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {accounts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
          <p className="text-sm font-semibold text-[var(--fg)]">No accounts added yet</p>
          <p className="text-xs text-[var(--fg-muted)]">Add your checking, savings, or credit card accounts to see where you stand.</p>
          <button
            onClick={onOpenAddAccount}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 transition"
          >
            + Add Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isCredit = acc.type === 'CREDIT_CARD';
            const isSavings = acc.type === 'SAVINGS';
            const isInvestment = acc.type === 'INVESTMENT';

            return (
              <div
                key={acc.id}
                onClick={() => {
                  if (onOpenDrilldown) {
                    const accTxs = transactions.filter((t) => t.accountId === acc.id);
                    onOpenDrilldown(
                      `${acc.name} Ledger`,
                      accTxs,
                      `${acc.institutionName || 'Account'} • Balance: ${formatAmount(acc.balance)} • ${accTxs.length} records`
                    );
                  } else {
                    onNavigateToTransactions({ accountId: acc.id });
                  }
                }}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition space-y-4 cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--fg-muted)] block">
                      {acc.institutionName || 'Account'}
                    </span>
                    <h3 className="font-semibold text-[var(--fg)] text-sm mt-0.5 truncate max-w-[200px]">
                      {acc.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditAccount(acc);
                      }}
                      className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition opacity-0 group-hover:opacity-100"
                      title="Edit Account"
                    >
                      <span className="text-[10px] font-medium px-1">Edit</span>
                    </button>
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)]">
                      {isCredit ? (
                        <CreditCard className="w-4 h-4 text-amber-400" />
                      ) : isInvestment ? (
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                      ) : isSavings ? (
                        <Building2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Wallet className="w-4 h-4 text-[var(--fg)]" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[var(--fg-muted)] text-[11px] block">
                    {isCredit ? 'Current Balance' : 'Available Balance'}
                  </span>
                  <div
                    className={`text-2xl font-bold tracking-tight mt-0.5 tabular ${
                      isCredit ? 'text-amber-400' : 'text-[var(--fg)]'
                    }`}
                  >
                    {formatAmount(acc.balance)}
                  </div>
                </div>

                {isCredit && acc.creditLimit && (
                  <div className="pt-3 border-t border-[var(--border)] space-y-2 text-xs">
                    <div className="flex justify-between text-[11px] text-[var(--fg-muted)]">
                      <span>Credit limit: {formatAmount(acc.creditLimit)}</span>
                      <span className="text-emerald-400">
                        Avail: {formatAmount(acc.creditLimit - Math.abs(acc.balance))}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (Math.abs(acc.balance) / acc.creditLimit) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--fg-subtle)]">
                      <span>Due: {acc.paymentDueDay}th of month</span>
                      <span>APR: {acc.apr}%</span>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--fg-subtle)] font-mono">
                  <span className="text-[10px] text-emerald-400 group-hover:text-emerald-300 transition">
                    View activity →
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToTransactions({ accountId: acc.id });
                      }}
                      className="text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition underline"
                    >
                      Ledger
                    </button>
                    <span>•••• {acc.accountNumberLast4 || '4182'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transfer Funds Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-semibold text-[var(--fg)] text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[var(--fg-muted)]" /> Transfer Funds
              </h3>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--fg-muted)] mb-1 font-medium">Source Account (Debit)</label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatAmount(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--fg-muted)] mb-1 font-medium">Target Account (Credit)</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === sourceId}>
                      {acc.name} ({formatAmount(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--fg-muted)] mb-1 font-medium">Transfer Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="500.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block text-[var(--fg-muted)] mb-1 font-medium">Note / Purpose</label>
                <input
                  type="text"
                  placeholder="Monthly savings sweep"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !transferAmount}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Statement Importer Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-semibold text-[var(--fg)] text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Statement CSV Importer
              </h3>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-dashed border-[var(--border)] rounded-xl p-6 text-center space-y-3 bg-[var(--surface-2)]">
              <div className="w-10 h-10 rounded-full bg-[var(--surface)] text-[var(--fg)] flex items-center justify-center mx-auto border border-[var(--border)]">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[var(--fg)] block">
                  Upload bank statement (CSV, OFX)
                </span>
                <span className="text-[11px] text-[var(--fg-subtle)]">Automatic column mapping and deduplication</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  alert('Demo CSV statement parsed: 14 transactions mapped with duplicate detection.');
                  setIsCsvModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--fg)] text-xs font-medium border border-[var(--border)]"
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
