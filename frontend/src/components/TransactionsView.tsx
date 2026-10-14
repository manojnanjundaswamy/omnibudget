import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Users,
  Edit2,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Columns,
  LayoutList,
  Upload,
  Download,
  CalendarPlus,
  TrendingUp,
} from 'lucide-react';
import { Transaction, Account, BudgetEnvelope, TransactionType, TransactionFilter } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import { CsvImportModal } from './CsvImportModal';
import { MonthCalendar, CalendarChip, toIsoDay } from './MonthCalendar';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  initialFilter?: TransactionFilter;
  onRefresh: () => void;
  onOpenAddModal: (initialDate?: string, initialType?: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenAddBill?: (initialDate?: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  envelopes,
  initialFilter,
  onRefresh,
  onOpenAddModal,
  onEditTransaction,
  onOpenAddBill,
}) => {
  const { formatAmount } = useCurrency();

  // View mode: split (side-by-side calendar + ledger on desktop), calendar, or list
  const [viewMode, setViewMode] = useState<'split' | 'calendar' | 'list'>('split');

  // Calendar month state ("YYYY-MM")
  const [calendarMonth, setCalendarMonth] = useState<string>(() => {
    return toIsoDay(new Date()).slice(0, 7);
  });

  // Filter states
  const [search, setSearch] = useState(initialFilter?.search || '');
  const [selectedAccountId, setSelectedAccountId] = useState(initialFilter?.accountId || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilter?.category || '');
  const [selectedType, setSelectedType] = useState<TransactionType | ''>(initialFilter?.type || '');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingConfirmId, setDeletingConfirmId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleExportCsv = async () => {
    try {
      const csvData = await api.exportTransactionsCsv();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'omnibudget-transactions.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  // Group transactions by date string ("YYYY-MM-DD")
  const byDay = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      if (tx.date) {
        const existing = map.get(tx.date) || [];
        existing.push(tx);
        map.set(tx.date, existing);
      }
    }
    return map;
  }, [transactions]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedDate && t.date !== selectedDate) return false;
      if (selectedAccountId && t.accountId !== selectedAccountId) return false;
      if (selectedCategory && t.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedType && t.type !== selectedType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchMerchant = t.merchant?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCat = t.category?.toLowerCase().includes(q);
        const matchAcc = t.accountName?.toLowerCase().includes(q);
        if (!matchMerchant && !matchDesc && !matchCat && !matchAcc) return false;
      }
      return true;
    });
  }, [transactions, selectedAccountId, selectedCategory, selectedType, search, selectedDate]);

  const hasActiveFilters = Boolean(search || selectedAccountId || selectedCategory || selectedType || selectedDate);

  const clearFilters = () => {
    setSearch('');
    setSelectedAccountId('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedDate(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await api.deleteTransaction(id);
      setDeletingConfirmId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // Calendar chips provider
  const getCalendarChips = (dateStr: string): CalendarChip[] => {
    const dayTxs = byDay.get(dateStr) || [];
    return dayTxs.map((t) => ({
      id: t.id,
      label: `${t.merchant || t.description || 'Entry'} ${formatAmount(t.netPersonalAmount !== undefined ? t.netPersonalAmount : t.amount)}`,
      title: `${t.merchant || t.description || 'Transaction'}: ${formatAmount(t.amount)} (${t.category || t.type})`,
      tone: t.type === 'INCOME' ? 'good' : 'default',
      amount: t.amount,
      onOpen: () => onEditTransaction(t),
    }));
  };

  // Calendar flows provider (inflow / outflow totals per day)
  const getCalendarFlows = (dateStr: string) => {
    const dayTxs = byDay.get(dateStr) || [];
    let inTotal = 0;
    let outTotal = 0;
    for (const t of dayTxs) {
      if (t.type === 'INCOME') inTotal += Math.abs(t.amount);
      else if (t.type === 'EXPENSE') outTotal += Math.abs(t.netPersonalAmount !== undefined ? t.netPersonalAmount : t.amount);
    }
    return { in: inTotal, out: outTotal };
  };

  // Render Table Component
  const renderTable = (compact?: boolean) => {
    if (filteredTransactions.length === 0) {
      return (
        <div className="p-8 sm:p-12 text-center text-[var(--fg-muted)] space-y-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <p className="text-sm font-medium text-[var(--fg)]">No transactions found</p>
          <p className="text-xs">
            {selectedDate ? `No entries recorded on ${selectedDate}.` : 'Try adjusting your filters or record a new transaction.'}
          </p>
          {selectedDate && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAddModal(selectedDate, 'EXPENSE')}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-semibold hover:opacity-90 transition"
              >
                + Add Expense on {selectedDate}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--fg)] text-xs hover:bg-[var(--surface-3)] transition border border-[var(--border)]"
              >
                Show All Dates
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] text-[11px] uppercase tracking-wider font-medium">
                <th className="py-3 px-3 sm:px-4">Date</th>
                <th className="py-3 px-3 sm:px-4">Merchant / Description</th>
                {!compact && <th className="py-3 px-3 sm:px-4">Category</th>}
                {!compact && <th className="py-3 px-3 sm:px-4">Account</th>}
                <th className="py-3 px-3 sm:px-4 text-right">Amount</th>
                <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                const isTransfer = tx.type === 'TRANSFER';
                const isSplit = Boolean(tx.splitGroupId || (tx.receivableAmount && tx.receivableAmount > 0));

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onEditTransaction(tx)}
                    className="interactive-row cursor-pointer group border-b border-[var(--border)] last:border-b-0 transition"
                  >
                    {/* Date */}
                    <td className="py-3 px-3 sm:px-4 text-[var(--fg-muted)] whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Merchant & Description */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isTransfer
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-[var(--surface-2)] text-[var(--fg-muted)]'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : isTransfer ? (
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-[var(--fg)] block truncate max-w-[140px] sm:max-w-xs">
                            {tx.merchant || tx.description || 'Transaction'}
                          </span>
                          {tx.description && tx.merchant && tx.description !== tx.merchant && (
                            <span className="text-[10px] text-[var(--fg-subtle)] block truncate max-w-[140px] sm:max-w-xs">
                              {tx.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category (if not compact) */}
                    {!compact && (
                      <td className="py-3 px-3 sm:px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-2)] text-[var(--fg)] border border-[var(--border)]">
                          {tx.category || 'General'}
                        </span>
                        {tx.envelopeName && (
                          <span className="text-[10px] text-[var(--fg-subtle)] block mt-0.5">
                            {tx.envelopeName}
                          </span>
                        )}
                      </td>
                    )}

                    {/* Account (if not compact) */}
                    {!compact && (
                      <td className="py-3 px-3 sm:px-4 text-[var(--fg-muted)] whitespace-nowrap">
                        {tx.accountName || 'Account'}
                      </td>
                    )}

                    {/* Amount */}
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-semibold tabular-nums text-xs ${
                          isIncome ? 'text-emerald-400' : 'text-[var(--fg)]'
                        }`}
                      >
                        {isIncome ? '+' : ''}
                        {formatAmount(tx.netPersonalAmount !== undefined ? tx.netPersonalAmount : tx.amount)}
                      </span>
                      {isSplit && !compact && (
                        <span className="flex items-center justify-end gap-1 text-[10px] text-emerald-400/80 mt-0.5">
                          <Users className="w-3 h-3" />
                          <span>Split gross: {formatAmount(tx.grossAmount || tx.amount)}</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                      {deletingConfirmId === tx.id ? (
                        <div
                          className="flex items-center justify-end gap-1.5 animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-rose-400 font-semibold mr-1">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] transition shadow-xs"
                          >
                            {deletingId === tx.id ? '...' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingConfirmId(null)}
                            className="px-2 py-0.5 rounded-lg bg-[var(--surface-2)] text-[var(--fg)] text-[10px] hover:bg-[var(--surface-3)] transition border border-[var(--border)]"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTransaction(tx);
                            }}
                            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingConfirmId(tx.id);
                            }}
                            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Filter Toolbar
  const renderFilterToolbar = () => (
    <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--fg-muted)] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant, notes..."
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-[var(--fg)] placeholder-[var(--fg-subtle)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Account Filter */}
        <div>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as TransactionType | '')}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">All Types</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfer</option>
            <option value="GROUP_SPLIT_PAYMENT">Group Split</option>
            <option value="SETTLEMENT">Settlement</option>
          </select>
        </div>
      </div>

      {/* Filter Indicator / Reset */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--fg-muted)] text-[11px]">
              Showing {filteredTransactions.length} of {transactions.length} entries
            </span>
            {selectedDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--fg)]">
                <CalendarIcon className="w-3 h-3 text-[var(--accent)]" />
                <span>Date: {selectedDate}</span>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="hover:text-red-500 transition ml-0.5"
                  title="Clear date filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition ml-auto"
          >
            <X className="w-3 h-3" />
            <span>Clear filters</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Transactions</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Every expense, income, and transfer · Interactive calendar and ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Segmented Control: [ Split | Calendar | List ] */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'split'
                  ? 'bg-[var(--surface)] text-[var(--fg)] shadow-xs font-semibold'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
              title="Side-by-side Calendar and Ledger"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'calendar'
                  ? 'bg-[var(--surface)] text-[var(--fg)] shadow-xs font-semibold'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
              title="Monthly Calendar View"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'list'
                  ? 'bg-[var(--surface)] text-[var(--fg)] shadow-xs font-semibold'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
              title="Table List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            title="Download full transaction ledger as CSV"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            title="Upload CSV from bank or spreadsheet"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
            <span>Import</span>
          </button>

          <button
            onClick={() => onOpenAddModal(selectedDate || undefined, 'EXPENSE')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] transition shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Main Content Area based on View Mode */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <MonthCalendar
            currentMonth={calendarMonth}
            onMonthChange={setCalendarMonth}
            chips={getCalendarChips}
            flows={getCalendarFlows}
            formatAmount={formatAmount}
            onAddTransactionOnDate={(dateStr, type) => onOpenAddModal(dateStr, type)}
            onAddBillOnDate={(dateStr) => onOpenAddBill?.(dateStr)}
            onSelectDateForFilter={(dateStr) => {
              setSelectedDate(dateStr);
              setViewMode('split');
            }}
          />
        </div>
      )}

      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Confluence-style interactive Month Calendar (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <MonthCalendar
              currentMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
              chips={getCalendarChips}
              flows={getCalendarFlows}
              formatAmount={formatAmount}
              onAddTransactionOnDate={(dateStr, type) => onOpenAddModal(dateStr, type)}
              onAddBillOnDate={(dateStr) => onOpenAddBill?.(dateStr)}
              onSelectDateForFilter={(dateStr) => setSelectedDate(dateStr)}
            />
          </div>

          {/* Right: Selected Date details or Quick Filter Ledger (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--fg)]">
                  {selectedDate ? `Entries on ${selectedDate}` : 'Filtered Ledger'}
                </h3>
                <p className="text-[11px] text-[var(--fg-muted)]">
                  {selectedDate ? 'Transactions recorded for this day' : 'All recent entries'}
                </p>
              </div>

              {selectedDate && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenAddModal(selectedDate, 'EXPENSE')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg)] border border-[var(--border)] text-[11px] font-medium transition"
                  >
                    <Plus className="w-3 h-3 text-[var(--accent)]" />
                    <span>Add here</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {renderTable(true)}
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {renderFilterToolbar()}
          {renderTable(false)}
        </div>
      )}

      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          onRefresh();
          setIsImportModalOpen(false);
        }}
      />
    </div>
  );
};
