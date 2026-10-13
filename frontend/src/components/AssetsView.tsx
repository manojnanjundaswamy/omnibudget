import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  DollarSign,
  PieChart,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Asset, AssetPortfolioSummary, AssetType, CreateAssetPayload } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { AnimatedAmount } from './AnimatedAmount';
import { api } from '../services/api';

const ASSET_TYPE_LABELS: Record<AssetType, { label: string; color: string }> = {
  STOCK: { label: 'Stocks & Equities', color: '#3b82f6' },
  SIP: { label: 'Systematic Investment Plan', color: '#10b981' },
  MUTUAL_FUND: { label: 'Mutual Funds', color: '#8b5cf6' },
  CRYPTO: { label: 'Digital Assets', color: '#f59e0b' },
  REAL_ESTATE: { label: 'Real Estate', color: '#06b6d4' },
  GOLD: { label: 'Gold & Precious Metals', color: '#eab308' },
  OTHER: { label: 'Other Investments', color: '#64748b' },
};

export const AssetsView: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [summary, setSummary] = useState<AssetPortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formType, setFormType] = useState<AssetType>('STOCK');
  const [formQuantity, setFormQuantity] = useState('');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formSipMonthly, setFormSipMonthly] = useState('');
  const [formSipDay, setFormSipDay] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const data = await api.getAssetSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const openAddModal = (presetType?: AssetType) => {
    setEditingAsset(null);
    setFormName('');
    setFormSymbol('');
    setFormType(presetType || 'STOCK');
    setFormQuantity('');
    setFormBuyPrice('');
    setFormCurrentPrice('');
    setFormSipMonthly(presetType === 'SIP' ? '250' : '');
    setFormSipDay(presetType === 'SIP' ? '5' : '');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormSymbol(asset.symbol || '');
    setFormType(asset.type);
    setFormQuantity(asset.quantity ? String(asset.quantity) : '');
    setFormBuyPrice(asset.buyPrice ? String(asset.buyPrice) : '');
    setFormCurrentPrice(asset.currentPrice ? String(asset.currentPrice) : '');
    setFormSipMonthly(asset.sipMonthlyContribution ? String(asset.sipMonthlyContribution) : '');
    setFormSipDay(asset.sipDayOfMonth ? String(asset.sipDayOfMonth) : '');
    setFormNotes(asset.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    try {
      setIsSaving(true);
      const payload: CreateAssetPayload = {
        name: formName.trim(),
        symbol: formSymbol.trim() ? formSymbol.trim().toUpperCase() : undefined,
        type: formType,
        quantity: formQuantity ? parseFloat(formQuantity) : undefined,
        buyPrice: formBuyPrice ? parseFloat(formBuyPrice) : undefined,
        currentPrice: formCurrentPrice ? parseFloat(formCurrentPrice) : undefined,
        sipMonthlyContribution: formSipMonthly ? parseFloat(formSipMonthly) : undefined,
        sipDayOfMonth: formSipDay ? parseInt(formSipDay, 10) : undefined,
        notes: formNotes.trim() || undefined,
      };

      if (editingAsset) {
        await api.updateAsset(editingAsset.id, payload);
      } else {
        await api.createAsset(payload);
      }

      setIsModalOpen(false);
      await fetchPortfolio();
    } catch (err) {
      console.error('Error saving asset:', err);
      alert('Failed to save asset. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your portfolio?`)) return;
    try {
      await api.deleteAsset(id);
      await fetchPortfolio();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  const assets = summary?.assets || [];
  const filteredAssets = filterType === 'ALL'
    ? assets
    : assets.filter((a) => a.type === filterType);

  const totalInvested = summary?.totalInvested || 0;
  const totalValue = summary?.totalCurrentValue || 0;
  const totalGain = summary?.totalGainLoss || 0;
  const totalGainPercent = summary?.totalGainLossPercent || 0;
  const totalSip = summary?.totalMonthlySip || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg)]">
            Assets & Investments
          </h1>
          <p className="text-sm text-[var(--fg-muted)] mt-1">
            Track stocks, monthly SIPs, mutual funds, and precious metals under one calm umbrella.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddModal('SIP')}
            className="interactive-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] hover:bg-[var(--surface-2)] shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            + New SIP
          </button>
          <button
            onClick={() => openAddModal()}
            className="interactive-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--accent)] text-white hover:opacity-90 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Investment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="interactive-card bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-1">
            <span>Portfolio Value</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--fg)] tracking-tight">
            <AnimatedAmount value={totalValue} />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                totalGain >= 0
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-rose-500/10 text-rose-600'
              }`}
            >
              {totalGain >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {totalGain >= 0 ? '+' : ''}{totalGainPercent.toFixed(1)}%
            </span>
            <span className="text-[var(--fg-subtle)]">
              ({totalGain >= 0 ? '+' : ''}{formatAmount(totalGain)} return)
            </span>
          </div>
        </div>

        {/* Invested Capital */}
        <div className="interactive-card bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-1">
            <span>Total Invested</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--fg)] tracking-tight">
            <AnimatedAmount value={totalInvested} />
          </div>
          <p className="text-xs text-[var(--fg-muted)] mt-2">
            Net capital contributed to date
          </p>
        </div>

        {/* Monthly SIP Outflow */}
        <div className="interactive-card bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-1">
            <span>Automated SIPs</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            <AnimatedAmount value={totalSip} />
            <span className="text-xs font-normal text-[var(--fg-muted)]">/mo</span>
          </div>
          <p className="text-xs text-[var(--fg-muted)] mt-2">
            Compounding on autopilot every month
          </p>
        </div>

        {/* Asset Count & Diversity */}
        <div className="interactive-card bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-1">
            <span>Holdings Diversity</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--fg)] tracking-tight">
            {assets.length} <span className="text-sm font-normal text-[var(--fg-muted)]">assets</span>
          </div>
          <p className="text-xs text-[var(--fg-muted)] mt-2">
            Across {summary?.allocationByType ? Object.keys(summary.allocationByType).length : 0} asset classes
          </p>
        </div>
      </div>

      {/* Allocation Breakdown Bar */}
      {summary?.allocationByType && totalValue > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--fg)] mb-2">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
              Asset Allocation
            </span>
            <span className="text-[var(--fg-muted)]">{formatAmount(totalValue)} total</span>
          </div>
          {/* Progress Bar */}
          <div className="h-3 w-full bg-[var(--surface-2)] rounded-full overflow-hidden flex">
            {Object.entries(summary.allocationByType).map(([type, val]) => {
              const pct = (val / totalValue) * 100;
              const meta = ASSET_TYPE_LABELS[type as AssetType] || { label: type, color: '#94a3b8' };
              return (
                <div
                  key={type}
                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                  title={`${meta.label}: ${pct.toFixed(1)}% (${formatAmount(val)})`}
                  className="h-full transition-all hover:opacity-80"
                />
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
            {Object.entries(summary.allocationByType).map(([type, val]) => {
              const pct = (val / totalValue) * 100;
              const meta = ASSET_TYPE_LABELS[type as AssetType] || { label: type, color: '#94a3b8' };
              return (
                <div key={type} className="flex items-center gap-1.5 text-[var(--fg-muted)]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span>{meta.label}:</span>
                  <span className="font-semibold text-[var(--fg)]">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['ALL', 'STOCK', 'SIP', 'MUTUAL_FUND', 'CRYPTO', 'GOLD'].map((typeKey) => {
          const isSelected = filterType === typeKey;
          const label =
            typeKey === 'ALL'
              ? 'All Holdings'
              : ASSET_TYPE_LABELS[typeKey as AssetType]?.label.split(' ')[0] || typeKey;
          return (
            <button
              key={typeKey}
              onClick={() => setFilterType(typeKey)}
              className={`interactive-pill px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-[var(--fg)] text-[var(--bg)] shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--fg-muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Holdings List */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--fg-muted)]">Loading assets...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] text-[var(--fg-muted)] flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[var(--fg)]">No investments logged yet</h3>
            <p className="text-xs text-[var(--fg-muted)] mt-1 max-w-sm mx-auto">
              Add your stocks, index SIPs, gold, or crypto to see live portfolio valuations and returns.
            </p>
            <button
              onClick={() => openAddModal()}
              className="mt-4 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--accent)] text-white hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Investment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredAssets.map((asset) => {
              const meta = ASSET_TYPE_LABELS[asset.type] || { label: asset.type, color: '#64748b' };
              const isProfit = asset.unrealizedGainLoss >= 0;
              return (
                <div
                  key={asset.id}
                  className="interactive-row p-4 sm:px-6 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: meta.color }}
                    >
                      {asset.symbol ? asset.symbol.slice(0, 4) : asset.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--fg)]">{asset.name}</span>
                        {asset.symbol && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--fg-muted)]">
                            {asset.symbol}
                          </span>
                        )}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--fg-subtle)]">
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--fg-muted)] mt-1">
                        {asset.quantity && (
                          <span>Qty: <strong className="text-[var(--fg)]">{asset.quantity}</strong></span>
                        )}
                        {asset.buyPrice && (
                          <span>Avg Buy: <strong className="text-[var(--fg)]">{formatAmount(asset.buyPrice)}</strong></span>
                        )}
                        {asset.currentPrice && (
                          <span>Current: <strong className="text-[var(--fg)]">{formatAmount(asset.currentPrice)}</strong></span>
                        )}
                        {asset.sipMonthlyContribution && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <Calendar className="w-3 h-3" />
                            {formatAmount(asset.sipMonthlyContribution)}/mo on {asset.sipDayOfMonth || 1}th
                          </span>
                        )}
                      </div>
                      {asset.notes && (
                        <p className="text-xs text-[var(--fg-subtle)] italic mt-1">{asset.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-base font-bold text-[var(--fg)]">
                        {formatAmount(asset.currentValue || asset.investedAmount)}
                      </div>
                      <div className="text-xs text-[var(--fg-muted)]">
                        Invested: {formatAmount(asset.investedAmount)}
                      </div>
                      <div
                        className={`text-xs font-medium inline-flex items-center gap-0.5 mt-0.5 ${
                          isProfit ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isProfit ? '+' : ''}{formatAmount(asset.unrealizedGainLoss)} ({isProfit ? '+' : ''}
                        {(asset.unrealizedGainLossPercent || 0).toFixed(1)}%)
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[var(--fg-muted)]">
                      <button
                        onClick={() => openEditModal(asset)}
                        className="p-1.5 hover:text-[var(--fg)] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                        title="Edit holding"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id, asset.name)}
                        className="p-1.5 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete holding"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs modal-backdrop">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-xl relative modal-content">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--fg-muted)] hover:text-[var(--fg)] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold text-[var(--fg)] mb-1">
              {editingAsset ? 'Edit Investment Holding' : 'Add Investment Holding'}
            </h2>
            <p className="text-xs text-[var(--fg-muted)] mb-4">
              Enter your purchase details or systematic plan to track automatic compounding.
            </p>

            <form onSubmit={handleSaveAsset} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple Inc. or Vanguard S&P 500"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">Ticker / Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. AAPL"
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">Asset Class</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as AssetType)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">Holdings Qty</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 25"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">Avg Buy Price</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 150.00"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">Current Price</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 185.50"
                    value={formCurrentPrice}
                    onChange={(e) => setFormCurrentPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Monthly SIP options */}
              <div className="p-3 bg-[var(--surface-2)]/60 rounded-xl border border-[var(--border)]">
                <div className="text-xs font-semibold text-[var(--fg)] mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  Systematic Monthly Investment (SIP / DCA)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[var(--fg-muted)] mb-1">Monthly Amount</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 500"
                      value={formSipMonthly}
                      onChange={(e) => setFormSipMonthly(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--fg-muted)] mb-1">Day of Month (1-31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="e.g. 5"
                      value={formSipDay}
                      onChange={(e) => setFormSipDay(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">Notes / Tags</label>
                <input
                  type="text"
                  placeholder="e.g. Long-term retirement, taxed brokerage account"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--fg-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingAsset ? 'Save Changes' : 'Add Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
