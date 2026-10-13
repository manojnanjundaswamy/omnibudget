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
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[#1c1c1c]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f4]">Recurring Bills & Radar</h2>
          <p className="text-xs text-[#9e9e98] mt-0.5">
            Ghost subscription audit • Upcoming auto-debit calendar • Outflow forecasting
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[#9e9e98] text-[11px] block">Monthly Recurring Drain</span>
            <span className="text-2xl font-bold text-[#f5f5f4] tabular-nums">
              {formatAmount(totalMonthly)}/mo
            </span>
            <span className="text-[10px] text-[#6b6b66] block">
              Annual run-rate: {formatAmount(totalMonthly * 12)}/yr
            </span>
          </div>

          <button
            onClick={onOpenAddSubscription}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#f5f5f4] hover:bg-white text-[#0a0a0a] transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Subscriptions Grid */}
      {subscriptions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#121212] border border-[#242424] space-y-3">
          <p className="text-sm font-semibold text-[#f5f5f4]">No recurring subscriptions tracked</p>
          <p className="text-xs text-[#9e9e98]">Add your Netflix, Spotify, gym, or SaaS subscriptions to monitor monthly renewal drain.</p>
          <button
            onClick={onOpenAddSubscription}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f5f5f4] text-[#0a0a0a] hover:bg-white transition"
          >
            + Track Your First Subscription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => {
            return (
              <div
                key={sub.id}
                onClick={() => onEditSubscription(sub)}
                className="p-5 rounded-2xl bg-[#121212] border border-[#242424] hover:border-[#383838] transition space-y-4 cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-center">
                      {getSubIcon(sub.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#f5f5f4] text-xs">{sub.name}</h3>
                      <span className="text-[11px] text-[#9e9e98]">{sub.category || 'Subscription'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-[#f5f5f4] tabular-nums block">
                      {formatAmount(sub.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSubscription(sub);
                      }}
                      className="text-[10px] text-[#737373] hover:text-[#f5f5f4] transition opacity-0 group-hover:opacity-100"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1e1e1e] flex items-center justify-between text-xs text-[#9e9e98]">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#6b6b66]" /> Next: {sub.nextBillingDate}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#6b6b66] px-2 py-0.5 rounded bg-[#181818]">
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
