import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  LayoutGrid,
  Check,
  Plus,
  RotateCcw,
  Sparkles,
  X,
  CreditCard,
} from 'lucide-react';
import {
  WidgetConfig,
  WidgetSize,
  WidgetType,
  DEFAULT_DASHBOARD_WIDGETS,
  WIDGET_CATALOG,
} from './types';
import { WidgetCard } from './WidgetCard';
import {
  SafeToSpendWidget,
  SpendingByCategoryWidget,
  CashFlowWidget,
  BudgetsWidget,
  AccountsWidget,
  PeerDebtsWidget,
  HouseholdWidget,
  BillsRadarWidget,
  RecentTransactionsWidget,
  GoalsWidget,
} from './WidgetComponents';
import {
  DashboardSummary,
  Transaction,
  Account,
  BudgetEnvelope,
  Subscription,
  Household,
  SimplifiedDebtItem,
  Goal,
} from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  transactions: Transaction[];
  accounts: Account[];
  envelopes: BudgetEnvelope[];
  subscriptions: Subscription[];
  household: Household | null;
  simplifiedDebts: SimplifiedDebtItem[];
  goals?: Goal[];
  onOpenQuickCapture: () => void;
  onSimulatePaycheck: () => void;
  onSimulateExpense: () => void;
  onNavigateToTransactions?: (filter?: { accountId?: string; category?: string; envelopeId?: string }) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onOpenDrilldown?: (title: string, transactions: Transaction[], subtitle?: string) => void;
}

const STORAGE_KEY = 'omnibudget_custom_dashboard_v1';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  transactions,
  accounts,
  envelopes,
  subscriptions,
  household,
  simplifiedDebts,
  goals = [],
  onOpenQuickCapture,
  onSimulatePaycheck,
  onSimulateExpense,
  onNavigateToTransactions,
  onEditTransaction,
  onOpenDrilldown,
}) => {
  const { formatAmount } = useCurrency();
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Load from localStorage or fallback to defaults
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_DASHBOARD_WIDGETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (e) {
      console.error(e);
    }
  }, [widgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        const reordered = [...items];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        return reordered;
      });
    }
  };

  const handleUpdateSize = (id: string, size: WidgetSize) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size } : w))
    );
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleAddWidget = (type: WidgetType) => {
    const meta = WIDGET_CATALOG[type];
    const newWidget: WidgetConfig = {
      id: `w-${type}-${Date.now()}`,
      type,
      size: meta.defaultSize,
    };
    setWidgets((prev) => [...prev, newWidget]);
    setIsLibraryOpen(false);
  };

  const handleResetLayout = () => {
    setWidgets(DEFAULT_DASHBOARD_WIDGETS);
    setEditing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const renderWidgetContent = (type: WidgetType) => {
    const props = {
      summary,
      transactions,
      accounts,
      envelopes,
      subscriptions,
      household,
      simplifiedDebts,
      goals,
      onNavigateToTransactions,
      onEditTransaction,
      onOpenDrilldown,
    };
    switch (type) {
      case 'safe-to-spend':
        return <SafeToSpendWidget {...props} />;
      case 'spending-by-category':
        return <SpendingByCategoryWidget {...props} />;
      case 'cash-flow':
        return <CashFlowWidget {...props} />;
      case 'budgets':
        return <BudgetsWidget {...props} />;
      case 'accounts':
        return <AccountsWidget {...props} />;
      case 'goals':
        return <GoalsWidget {...props} />;
      case 'peer-debts':
        return <PeerDebtsWidget {...props} />;
      case 'household':
        return <HouseholdWidget {...props} />;
      case 'bills-radar':
        return <BillsRadarWidget {...props} />;
      case 'recent-transactions':
        return <RecentTransactionsWidget {...props} />;
      default:
        return null;
    }
  };

  const activeWidget = widgets.find((w) => w.id === activeId);

  return (
    <div className="space-y-6">
      {/* Top Greeting & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[#1c1c1c]">
        <div>
          <p className="text-xs text-[#9e9e98]">{dateStr}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f4]">
              {greeting()}, Alex
            </h2>
            {summary && (
              <span
                onClick={() => {
                  if (onOpenDrilldown) {
                    onOpenDrilldown(
                      'Total Portfolio Transactions',
                      transactions,
                      `Total Net Worth: ${formatAmount(summary.netWorth)} • ${transactions.length} records across ${accounts.length} accounts`
                    );
                  } else {
                    onNavigateToTransactions?.();
                  }
                }}
                className="text-xs px-2.5 py-0.5 rounded-full bg-[#181818] border border-[#262626] hover:border-emerald-500/50 text-[#9e9e98] font-mono cursor-pointer transition group"
                title="Click to drill down into entire ledger activity"
              >
                Net Worth: <strong className="text-[#f5f5f4] group-hover:text-emerald-400 transition">{formatAmount(summary.netWorth)}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editing && (
            <>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#333333] bg-[#181818] hover:bg-[#222222] text-[#f5f5f4] text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add widget</span>
              </button>
              <button
                type="button"
                onClick={handleResetLayout}
                className="p-1.5 rounded-lg border border-[#262626] text-[#9e9e98] hover:text-[#f5f5f4] hover:bg-[#181818] transition text-xs"
                title="Reset layout to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              editing
                ? 'bg-white text-black shadow-sm'
                : 'bg-[#181818] hover:bg-[#222222] text-[#f5f5f4] border border-[#262626]'
            }`}
          >
            {editing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-[#9e9e98]" />
                <span>Customize</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editing Mode Banner */}
      {editing && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-[#333333] bg-[#141414] text-xs text-[#9e9e98]">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Drag widgets by their handle to rearrange. Use <strong className="text-[#f5f5f4]">S / M / L / XL</strong> to resize, or remove what you don't need.
          </span>
        </div>
      )}

      {/* Sortable Drag & Drop Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {widgets.map((w) => (
              <WidgetCard
                key={w.id}
                widget={w}
                editing={editing}
                onUpdateSize={handleUpdateSize}
                onRemove={handleRemoveWidget}
              >
                {renderWidgetContent(w.type)}
              </WidgetCard>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? (
            <div className="rounded-2xl border border-white/20 bg-[#121212] p-5 shadow-2xl opacity-90">
              <span className="font-semibold text-xs text-white">
                {WIDGET_CATALOG[activeWidget.type]?.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Widget Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#f5f5f4]">Widget Library</h3>
                <p className="text-xs text-[#9e9e98]">Add cards to customize your dashboard</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="text-[#9e9e98] hover:text-[#f5f5f4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(Object.keys(WIDGET_CATALOG) as WidgetType[]).map((type) => {
                const item = WIDGET_CATALOG[type];
                const isAlreadyPresent = widgets.some((w) => w.type === type);

                return (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#242424] text-xs hover:border-[#333333] transition"
                  >
                    <div>
                      <span className="font-semibold text-[#f5f5f4] block">{item.name}</span>
                      <span className="text-[11px] text-[#9e9e98] block">{item.description}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddWidget(type)}
                      className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#303030] text-[#f5f5f4] font-medium transition text-xs shrink-0"
                    >
                      {isAlreadyPresent ? '+ Add Another' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
