import React from 'react';
import {
  X,
  ReceiptText,
  ExternalLink,
  Edit2,
  Calendar,
  Building2,
  Tag,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Transaction, NavTab, TransactionFilter } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface TransactionDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  transactions: Transaction[];
  onNavigateToTab: (tab: NavTab, filter?: TransactionFilter) => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionDrilldownModal: React.FC<TransactionDrilldownModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  transactions,
  onNavigateToTab,
  onEditTransaction,
}) => {
  const { formatAmount } = useCurrency();

  if (!isOpen) return null;

  const totalSum = transactions.reduce((acc, t) => acc + (t.netPersonalAmount || t.amount), 0);

  const handleOpenCategory = (cat: string) => {
    onClose();
    onNavigateToTab('budgets');
  };

  const handleOpenAccount = (accountId: string) => {
    onClose();
    onNavigateToTab('transactions', { accountId });
  };

  const handleOpenFullLedger = () => {
    onClose();
    onNavigateToTab('transactions');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">{title}</h3>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-400">
                {transactions.length} records
              </span>
            </div>
            {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Slice Total</span>
              <span className={`text-base font-bold ${totalSum >= 0 ? 'text-emerald-400' : 'text-white'}`}>
                {formatAmount(totalSum)}
              </span>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No underlying transactions found for this slice.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {transactions.map(t => {
                const amount = t.netPersonalAmount !== undefined ? t.netPersonalAmount : t.amount;
                const isIncome = amount > 0;

                return (
                  <div
                    key={t.id}
                    className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-zinc-800/40 rounded-xl transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate">
                          {t.merchant || t.description || 'Transaction'}
                        </span>
                        <span className="text-[11px] text-zinc-500 shrink-0">
                          {t.date}
                        </span>
                      </div>

                      {/* Clickable Cross-Links */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {/* Account Link */}
                        <button
                          type="button"
                          onClick={() => handleOpenAccount(t.accountId)}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium flex items-center gap-1 transition"
                          title="View this account in Ledger"
                        >
                          <Building2 className="w-2.5 h-2.5 text-zinc-400" />
                          <span>{t.accountName || 'Account'}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
                        </button>

                        {/* Category Link */}
                        {t.category && (
                          <button
                            type="button"
                            onClick={() => handleOpenCategory(t.category)}
                            className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-medium flex items-center gap-1 transition"
                            title="Jump to Category Budget"
                          >
                            <Tag className="w-2.5 h-2.5 text-indigo-400" />
                            <span>{t.category}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold ${isIncome ? 'text-emerald-400' : 'text-zinc-200'}`}>
                        {formatAmount(amount)}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditTransaction(t);
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
                        title="Edit transaction details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Jump Button */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-500">
            Click on any account or category pill above to jump directly there.
          </span>
          <button
            type="button"
            onClick={handleOpenFullLedger}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>Open Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
