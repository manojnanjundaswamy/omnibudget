import React, { useState } from 'react';
import {
  Clock,
  Tv,
  Music,
  Dumbbell,
  Cpu,
  Plus,
  Calendar as CalendarIcon,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  X,
  Edit3,
} from 'lucide-react';
import { Subscription } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { AnimatedAmount } from './AnimatedAmount';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  onOpenAddSubscription: (initialDate?: string) => void;
  onEditSubscription: (sub: Subscription) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  subscriptions,
  onOpenAddSubscription,
  onEditSubscription,
}) => {
  const { formatAmount } = useCurrency();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<{
    dateStr: string;
    day: number;
    formattedDate: string;
    bills: Subscription[];
  } | null>(null);

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

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  // Map subscriptions to day-of-month
  const billsByDay: Record<number, Subscription[]> = {};
  subscriptions.forEach((sub) => {
    if (sub.nextBillingDate) {
      const parts = sub.nextBillingDate.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (!isNaN(d)) {
          if (!billsByDay[d]) billsByDay[d] = [];
          billsByDay[d].push(sub);
        }
      }
    }
  });

  // Calculate upcoming due in next 7 days
  const upcomingIn7Days = subscriptions.filter((sub) => {
    if (!sub.nextBillingDate) return false;
    const billDate = new Date(sub.nextBillingDate);
    const diffTime = billDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).reduce((sum, s) => sum + s.amount, 0);

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const formattedDate = clickedDate.toLocaleDateString('default', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const dayBills = billsByDay[day] || [];
    setSelectedDateSchedule({
      dateStr,
      day,
      formattedDate,
      bills: dayBills,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Upcoming Bills & Radar</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Subscriptions, utilities, and auto-debits on a visual monthly calendar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'calendar'
                  ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'list'
                  ? 'bg-[var(--surface)] text-[var(--fg)] shadow-sm'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[var(--fg-muted)] text-[11px] block">Monthly total</span>
            <span className="text-xl font-bold text-[var(--fg)] tabular-nums">
              <AnimatedAmount value={totalMonthly} />/mo
            </span>
          </div>

          <button
            onClick={() => onOpenAddSubscription()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] transition shadow-sm interactive-btn shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1 interactive-card">
          <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider block">
            Committed This Month
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--fg)] tabular-nums block">
            <AnimatedAmount value={totalMonthly} />
          </span>
          <span className="text-[11px] text-[var(--fg-muted)]">
            Across {subscriptions.length} tracked commitments
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1 interactive-card">
          <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider block">
            Due in Next 7 Days
          </span>
          <span className="text-2xl font-bold tracking-tight text-amber-400 tabular-nums block">
            <AnimatedAmount value={upcomingIn7Days} />
          </span>
          <span className="text-[11px] text-[var(--fg-muted)]">
            Upcoming auto-debit payments
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1 interactive-card">
          <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider block">
            Annualized Impact
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--fg)] tabular-nums block">
            <AnimatedAmount value={totalMonthly * 12} />
          </span>
          <span className="text-[11px] text-[var(--fg-muted)]">
            Estimated 12-month fixed outflow
          </span>
        </div>
      </div>

      {/* View Mode: CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4 shadow-sm">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-[var(--fg)] tracking-tight">
                {monthName} {year}
              </h3>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition interactive-btn"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition interactive-btn"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition interactive-btn"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--fg-muted)] py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* 7-Column Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Trailing days of previous month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => {
              const prevDay = daysInPrevMonth - firstDayOfMonth + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-xl bg-[var(--surface-2)]/40 border border-transparent text-[var(--fg-subtle)] text-[11px] opacity-40 select-none"
                >
                  <span>{prevDay}</span>
                </div>
              );
            })}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = isCurrentMonth && day === todayDate;
              const dayBills = billsByDay[day] || [];
              const hasBills = dayBills.length > 0;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-xl border transition flex flex-col justify-between cursor-pointer group hover:shadow-sm ${
                    isToday
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                      : hasBills
                      ? 'border-[var(--border-strong)] bg-[var(--surface)] hover:border-emerald-500/50'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]'
                          : 'text-[var(--fg)]'
                      }`}
                    >
                      {day}
                    </span>
                    {hasBills && (
                      <span className="text-[10px] font-bold text-emerald-400 tabular-nums">
                        {formatAmount(dayBills.reduce((acc, b) => acc + b.amount, 0))}
                      </span>
                    )}
                  </div>

                  {/* Bill Chips */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayBills.map((bill) => {
                      const isPast = isCurrentMonth && day < todayDate;
                      const isDueToday = isCurrentMonth && day === todayDate;

                      return (
                        <div
                          key={bill.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSubscription(bill);
                          }}
                          title={`${bill.name} • ${formatAmount(bill.amount)} (${bill.cadence})`}
                          className={`px-1.5 py-1 rounded-md text-[10px] cursor-pointer transition truncate flex items-center justify-between gap-1 interactive-card ${
                            isPast
                              ? 'bg-[var(--surface-2)] text-[var(--fg-muted)] border border-[var(--border)]'
                              : isDueToday
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium'
                          }`}
                        >
                          <span className="truncate">{bill.name}</span>
                          <span className="tabular-nums shrink-0 font-bold">
                            {formatAmount(bill.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Mode: LIST VIEW */}
      {viewMode === 'list' && (
        <>
          {subscriptions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <p className="text-sm font-semibold text-[var(--fg)]">No recurring bills tracked</p>
              <p className="text-xs text-[var(--fg-muted)]">Add your streaming services, gym, rent, or utilities to keep track of renewals.</p>
              <button
                onClick={() => onOpenAddSubscription()}
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
        </>
      )}

      {/* Confluence-style Calendar Date Action Modal */}
      {/* Confluence-style Date Schedule Inspector Modal */}
      {selectedDateSchedule && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDateSchedule(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop-luxury overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card-luxury w-full max-w-md p-6 space-y-4 shadow-2xl ambient-accent my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--fg)] tracking-tight">
                    {selectedDateSchedule.formattedDate}
                  </h3>
                  <span className="text-[11px] text-[var(--fg-muted)] block">
                    {selectedDateSchedule.bills.length > 0
                      ? `${selectedDateSchedule.bills.length} recurring commitment${selectedDateSchedule.bills.length > 1 ? 's' : ''} due`
                      : 'No commitments scheduled on this date'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDateSchedule(null)}
                className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-transparent hover:border-[var(--border)]"
                title="Press Esc to close"
              >
                <span className="text-[10px] uppercase font-mono opacity-60 tracking-wider">esc</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Bills List */}
            {selectedDateSchedule.bills.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-[var(--fg-subtle)] tracking-wider block">
                  Scheduled Commitments
                </span>
                {selectedDateSchedule.bills.map((bill) => (
                  <div
                    key={bill.id}
                    onClick={() => {
                      onEditSubscription(bill);
                      setSelectedDateSchedule(null);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)]/70 border border-[var(--border)] hover:border-emerald-500/40 cursor-pointer transition interactive-card group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--fg)] shrink-0">
                        {getSubIcon(bill.name)}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-xs text-[var(--fg)] block truncate">
                          {bill.name}
                        </span>
                        <span className="text-[10px] text-[var(--fg-muted)] block">
                          {bill.category || 'Subscription'} • {bill.cadence}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-xs tabular text-[var(--fg)]">
                        {formatAmount(bill.amount)}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-400 group-hover:underline">
                        Edit →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <Clock className="w-8 h-8 text-[var(--fg-subtle)] mx-auto opacity-40" />
                <p className="text-xs text-[var(--fg-muted)]">
                  Keep your bills radar accurate by scheduling your rent, utilities, or recurring subscriptions.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedDateSchedule(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-transparent hover:border-[var(--border)]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetDate = selectedDateSchedule.dateStr;
                  setSelectedDateSchedule(null);
                  onOpenAddSubscription(targetDate);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 transition shadow-lg interactive-btn ml-auto active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Bill for {monthName} {selectedDateSchedule.day}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
