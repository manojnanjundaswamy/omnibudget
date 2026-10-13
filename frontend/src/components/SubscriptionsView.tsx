import React from 'react';
import {
  Clock,
  Tv,
  Music,
  Dumbbell,
  Cpu,
} from 'lucide-react';
import { Subscription } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ subscriptions }) => {
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

        <div className="text-right">
          <span className="text-[#9e9e98] text-[11px] block">Monthly Recurring Drain</span>
          <span className="text-2xl font-bold text-[#f5f5f4] tabular">
            {formatAmount(totalMonthly)}/mo
          </span>
          <span className="text-[10px] text-[#6b6b66] block">
            Annual run-rate: {formatAmount(totalMonthly * 12)}/yr
          </span>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((sub) => {
          return (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-[#121212] border border-[#242424] hover:border-[#333333] transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-center">
                    {getSubIcon(sub.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#f5f5f4] text-xs">{sub.name}</h3>
                    <span className="text-[11px] text-[#9e9e98]">{sub.category}</span>
                  </div>
                </div>

                <span className="text-sm font-bold text-[#f5f5f4] tabular">
                  {formatAmount(sub.amount)}
                </span>
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
    </div>
  );
};
