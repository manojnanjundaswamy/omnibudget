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
  Calendar,
  Building2,
  Tag,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { Transaction, Account, BudgetEnvelope, TransactionType, TransactionFilter } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  initialFilter?: TransactionFilter;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  envelopes,
  initialFilter,
  onRefresh,
  onOpenAddModal,
  onEditTransaction,
}) => {
  const { formatAmount } = useCurrency();

  const [search, setSearch] = useState(initialFilter?.search || '');
  const [selectedAccountId, setSelectedAccountId] = useState(initialFilter?.accountId || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilter?.category || '');
  const [selectedType, setSelectedType] = useState<TransactionType | ''>(initialFilter?.type || '');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  }, [transactions, selectedAccountId, selectedCategory, selectedType, search]);

  const hasActiveFilters = Boolean(search || selectedAccountId || selectedCategory || selectedType);

  const clearFilters = () => {
    setSearch('');
    setSelectedAccountId('');
    setSelectedCategory('');
    setSelectedType('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this transaction? The account balance and envelope budget will be reverted.')) {
      return;
    }
    try {
      setDeletingId(id);
      await api.deleteTransaction(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[#1c1c1c]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f4]">Ledger & Transactions</h2>
          <p className="text-xs text-[#9e9e98] mt-0.5">
            Real-time double-entry transaction audit stream • Drill down and filter by account or category
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f5f5f4] hover:bg-white text-[#0a0a0a] transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#121212] border border-[#242424] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant, notes..."
              className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl pl-9 pr-3 py-2 text-[#f5f5f4] placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
            />
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
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
              className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
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
              className="w-full bg-[#171717] border border-[#2a2a2a] rounded-xl px-3 py-2 text-[#f5f5f4] focus:outline-none focus:border-neutral-500"
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
          <div className="flex items-center justify-between pt-2 border-t border-[#1c1c1c] text-xs">
            <span className="text-[#9e9e98] text-[11px]">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[11px] text-[#9e9e98] hover:text-[#f5f5f4] transition"
            >
              <X className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#121212] border border-[#242424] overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-[#9e9e98] space-y-2">
            <p className="text-sm font-medium text-[#f5f5f4]">No transactions found</p>
            <p className="text-xs">Try adjusting your filters or record a new transaction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#202020] bg-[#161616]/70 text-[#9e9e98] text-[11px] uppercase tracking-wider font-medium">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Merchant / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4 text-right">Personal Impact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  const isTransfer = tx.type === 'TRANSFER';
                  const isSplit = Boolean(tx.splitGroupId || (tx.receivableAmount && tx.receivableAmount > 0));

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onEditTransaction(tx)}
                      className="hover:bg-[#181818] transition cursor-pointer group"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 text-[#9e9e98] whitespace-nowrap">
                        {tx.date}
                      </td>

                      {/* Merchant & Description */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-950/40 text-emerald-400'
                                : isTransfer
                                ? 'bg-blue-950/40 text-blue-400'
                                : 'bg-[#1e1e1e] text-[#9e9e98]'
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
                          <div>
                            <span className="font-medium text-[#f5f5f4] block">
                              {tx.merchant || tx.description || 'Transaction'}
                            </span>
                            {tx.description && tx.merchant && tx.description !== tx.merchant && (
                              <span className="text-[10px] text-[#737373] block truncate max-w-xs">
                                {tx.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#1c1c1c] text-[#d4d4d4] border border-[#282828]">
                          {tx.category || 'General'}
                        </span>
                        {tx.envelopeName && (
                          <span className="text-[10px] text-[#737373] block mt-0.5">
                            {tx.envelopeName}
                          </span>
                        )}
                      </td>

                      {/* Account */}
                      <td className="py-3 px-4 text-[#9e9e98] whitespace-nowrap">
                        {tx.accountName || 'Account'}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold tabular-nums text-xs ${
                            isIncome ? 'text-emerald-400' : 'text-[#f5f5f4]'
                          }`}
                        >
                          {isIncome ? '+' : ''}
                          {formatAmount(tx.netPersonalAmount !== undefined ? tx.netPersonalAmount : tx.amount)}
                        </span>
                        {isSplit && (
                          <span className="flex items-center justify-end gap-1 text-[10px] text-emerald-400/80 mt-0.5">
                            <Users className="w-3 h-3" />
                            <span>Split gross: {formatAmount(tx.grossAmount || tx.amount)}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTransaction(tx);
                            }}
                            className="p-1.5 rounded-lg text-[#9e9e98] hover:text-[#f5f5f4] hover:bg-[#252525] transition"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(tx.id, e)}
                            disabled={deletingId === tx.id}
                            className="p-1.5 rounded-lg text-[#9e9e98] hover:text-red-400 hover:bg-red-950/30 transition"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
