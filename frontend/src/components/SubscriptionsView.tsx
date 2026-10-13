import React from 'react';
import {
  CalendarDays,
  Clock,
  CreditCard,
  AlertCircle,
  Plus,
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
      return <Tv className="w-4 h-4 text-rose-400" />;
    }
    if (n.includes('spotify') || n.includes('apple music')) {
      return <Music className="w-4 h-4 text-emerald-400" />;
    }
    if (n.includes('gym') || n.includes('equinox') || n.includes('fitness')) {
      return <Dumbbell className="w-4 h-4 text-amber-400" />;
    }
    return <Cpu className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Recurring Bills & Subscriptions</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ghost subscription audit • Upcoming auto-debit calendar • Cash drain forecasting
          </p>
        </div>

        <div className="text-right">
          <span className="text-slate-400 text-xs block">Monthly Recurring Drain</span>
          <span className="text-2xl font-black text-rose-400">
            {formatAmount(totalMonthly)}/mo
          </span>
          <span className="text-[11px] text-slate-500 block">
            Annual Run-rate: {formatAmount(totalMonthly * 12)}/yr
          </span>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((sub) => {
          return (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                    {getSubIcon(sub.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{sub.name}</h3>
                    <span className="text-[11px] text-slate-400">{sub.category}</span>
                  </div>
                </div>

                <span className="text-sm font-black text-slate-100">
                  {formatAmount(sub.amount)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Next: {sub.nextBillingDate}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-800">
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
