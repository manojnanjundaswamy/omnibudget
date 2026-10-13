import React from 'react';
import {
  Clock,
  Tv,
  Music,
  Dumbbell,
  Cpu,
  Plus,
} from 'lucide-react';
import { Subscription } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { AnimatedAmount } from './AnimatedAmount';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  onOpenAddSubscription: () => void;
  onEditSubscription: (sub: Subscription) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  subscriptions,
  onOpenAddSubscription,
  onEditSubscription,
}) => {
  const { formatAmount } = useCurrency();

  const totalMonthly = subscriptions.reduce((sum, s) => {
    return sum + (s.cadence === 'ANNUAL' ? s.amount / 12 : s.amount);
  }, 0);

  const getSubIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('netflix') || n.includes('prime') || n.includes('hbo')) {
      return <Tv className="w-4 h-4 text-[#ededed]" />;
    }
    if (n.includes('spotify') || n.includes('apple music')) {
      return <Music className="w-4 h-4 text-[#ededed]" />;
    }
    if (n.includes('gym') || n.includes('equinox') || n.includes('fitness')) {
      return <Dumbbell className="w-4 h-4 text-[#ededed]" />;
    }
    return <Cpu className="w-4 h-4 text-[#ededed]" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Upcoming Bills</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Subscriptions, utilities, and auto-debits in one place
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[var(--fg-muted)] text-[11px] block">Monthly bills total</span>
            <span className="text-2xl font-bold text-[var(--fg)] tabular-nums">
              <AnimatedAmount value={totalMonthly} />/mo
            </span>
            <span className="text-[10px] text-[var(--fg-subtle)] block">
              Annual total: {formatAmount(totalMonthly * 12)}/yr
            </span>
          </div>

          <button
            onClick={onOpenAddSubscription}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] transition shadow-sm interactive-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Subscriptions Grid */}
      {subscriptions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
          <p className="text-sm font-semibold text-[var(--fg)]">No recurring bills tracked</p>
          <p className="text-xs text-[var(--fg-muted)]">Add your streaming services, gym, rent, or utilities to keep track of renewals.</p>
          <button
            onClick={onOpenAddSubscription}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 transition interactive-btn"
          >
            + Add Your First Bill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => {
            return (
              <div
                key={sub.id}
                onClick={() => onEditSubscription(sub)}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition space-y-4 cursor-pointer group interactive-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--fg)]">
                      {getSubIcon(sub.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--fg)] text-xs">{sub.name}</h3>
                      <span className="text-[11px] text-[var(--fg-muted)]">{sub.category || 'Subscription'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--fg)] tabular-nums block">
                      {formatAmount(sub.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSubscription(sub);
                      }}
                      className="text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition opacity-0 group-hover:opacity-100"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--fg-muted)]">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[var(--fg-subtle)]" /> Next: {sub.nextBillingDate}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[var(--fg-muted)] px-2 py-0.5 rounded bg-[var(--surface-2)]">
                    {sub.cadence}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
