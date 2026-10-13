import React, { useState, useEffect } from 'react';
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
  Search,
  Filter,
  Users2,
  Sparkles,
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
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.merchant?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.accountName?.toLowerCase().includes(q)
    );
  });

  const totalSum = filteredTransactions.reduce((acc, t) => acc + (t.netPersonalAmount || t.amount), 0);
  const avgAmount = filteredTransactions.length > 0 ? totalSum / filteredTransactions.length : 0;

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
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-luxury overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card-luxury w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ambient-accent my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--fg)] tracking-tight">{title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--fg-muted)] border border-[var(--border)]">
                  {filteredTransactions.length} entries
                </span>
              </div>
              {subtitle && <p className="text-xs text-[var(--fg-muted)] mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider font-semibold block">
                Total Volume
              </span>
              <span
                className={`text-base font-extrabold tabular-nums ${
                  totalSum > 0 ? 'text-emerald-500' : 'text-[var(--fg)]'
                }`}
              >
                {formatAmount(totalSum)}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 p-1.5 px-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-transparent hover:border-[var(--border)]"
              title="Press Esc to close"
            >
              <span className="text-[10px] uppercase font-mono opacity-60 tracking-wider">esc</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Search & Micro-Telemetry Bar */}
        <div className="px-6 py-2.5 bg-[var(--surface-2)]/50 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by merchant, category, account..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--fg)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none transition"
            />
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--fg-muted)]">
            <span>
              Avg: <strong className="text-[var(--fg)] font-semibold">{formatAmount(avgAmount)}</strong>
            </span>
            <span className="text-[var(--border)]">•</span>
            <span>
              Items: <strong className="text-[var(--fg)] font-semibold">{filteredTransactions.length}</strong>
            </span>
          </div>
        </div>

        {/* Scrollable Transactions List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2 flex-1 no-scrollbar">
          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--fg-muted)] space-y-2">
              <ReceiptText className="w-8 h-8 mx-auto opacity-30" />
              <p className="font-semibold text-[var(--fg)]">No matching transactions</p>
              <p className="text-[11px]">Try adjusting your search query or clear the filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filteredTransactions.map((t) => {
                const amount = t.netPersonalAmount !== undefined ? t.netPersonalAmount : t.amount;
                const isIncome = amount > 0;
                const isSplit = t.receivableAmount && t.receivableAmount > 0;

                return (
                  <div
                    key={t.id}
                    className="py-3 px-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-2)]/70 rounded-2xl transition-all group interactive-row cursor-pointer"
                    onClick={() => {
                      onClose();
                      onEditTransaction(t);
                    }}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--fg)] truncate">
                          {t.merchant || t.description || 'Transaction'}
                        </span>
                        {isSplit && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shrink-0 flex items-center gap-1">
                            <Users2 className="w-2.5 h-2.5" />
                            <span>Split</span>
                          </span>
                        )}
                        <span className="text-[11px] text-[var(--fg-muted)] shrink-0 font-mono">
                          {t.date}
                        </span>
                      </div>

                      {/* Clickable Cross-Links & Metadata Chips */}
                      <div
                        className="flex flex-wrap items-center gap-1.5 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Account Link */}
                        <button
                          type="button"
                          onClick={() => handleOpenAccount(t.accountId)}
                          className="px-2 py-0.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] font-medium flex items-center gap-1 transition"
                          title="View this account"
                        >
                          <Building2 className="w-2.5 h-2.5 text-[var(--fg-muted)]" />
                          <span>{t.accountName || 'Account'}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[var(--fg-muted)] opacity-60" />
                        </button>

                        {/* Category Link */}
                        {t.category && (
                          <button
                            type="button"
                            onClick={() => handleOpenCategory(t.category)}
                            className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-medium flex items-center gap-1 transition"
                            title="Jump to Category Budget"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            <span>{t.category}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        )}

                        {t.description && (
                          <span className="text-[10px] text-[var(--fg-subtle)] truncate italic max-w-xs">
                            "{t.description}"
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold tabular-nums block ${
                            isIncome ? 'text-emerald-500' : 'text-[var(--fg)]'
                          }`}
                        >
                          {isIncome ? '+' : ''}
                          {formatAmount(amount)}
                        </span>
                        {isSplit && (
                          <span className="text-[10px] text-emerald-400 font-mono block">
                            IOU: +{formatAmount(t.receivableAmount!)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onEditTransaction(t);
                        }}
                        className="p-1.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-3)] transition border border-transparent hover:border-[var(--border)]"
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
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-2)]/40 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[var(--fg-muted)] hidden sm:inline">
            Click on any transaction to edit details, or jump to its category envelope.
          </span>
          <button
            type="button"
            onClick={handleOpenFullLedger}
            className="px-4 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg)] text-xs font-semibold flex items-center gap-2 transition shadow-sm ml-auto"
          >
            <span>Open All Transactions Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
