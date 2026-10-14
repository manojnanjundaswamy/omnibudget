import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Plus, TrendingUp, CalendarPlus, List, Edit2, X } from 'lucide-react';
import { cn } from '../utilities/cn';

export interface CalendarChip {
  id: string;
  label: string;
  title?: string;
  tone?: 'default' | 'good' | 'critical' | 'warning';
  amount?: number;
  onOpen?: () => void;
}

export interface DayAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
}

export interface MonthCalendarProps {
  currentMonth: string; // "YYYY-MM"
  onMonthChange: (newMonth: string) => void;
  chips: (dateStr: string) => CalendarChip[];
  flows?: (dateStr: string) => { in: number; out: number };
  formatAmount: (amount: number) => string;
  onAddTransactionOnDate?: (dateStr: string, type: 'EXPENSE' | 'INCOME') => void;
  onAddBillOnDate?: (dateStr: string) => void;
  onSelectDateForFilter?: (dateStr: string) => void;
}

export function parseIsoDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y!, m! - 1, d || 1);
}

export function toIsoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getMonthBounds(monthStr: string) {
  const [y, m] = monthStr.split('-').map(Number);
  const start = `${monthStr}-01`;
  const endDate = new Date(y!, m!, 0);
  const end = toIsoDay(endDate);

  const prevMonthDate = new Date(y!, m! - 2, 1);
  const nextMonthDate = new Date(y!, m!, 1);

  const prev = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const next = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  return { start, end, prev, next, daysInMonth: endDate.getDate(), year: y!, monthIndex: m! - 1 };
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  currentMonth,
  onMonthChange,
  chips,
  flows,
  formatAmount,
  onAddTransactionOnDate,
  onAddBillOnDate,
  onSelectDateForFilter,
}) => {
  const bounds = getMonthBounds(currentMonth);
  const [selectedDayForMenu, setSelectedDayForMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const todayIso = toIsoDay(new Date());
  const thisMonthIso = todayIso.slice(0, 7);

  // Close day menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSelectedDayForMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDayForMenu(null);
      }
    };
    if (selectedDayForMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDayForMenu]);

  // Construct dates for the calendar
  const days: Date[] = [];
  for (let i = 1; i <= bounds.daysInMonth; i++) {
    days.push(new Date(bounds.year, bounds.monthIndex, i));
  }

  // Monday-first calculation
  const firstDayWeekday = new Date(bounds.year, bounds.monthIndex, 1).getDay(); // 0 = Sun
  const leadDays = (firstDayWeekday + 6) % 7; // Mon = 0, Sun = 6
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate monthly flow totals
  let totalIn = 0;
  let totalOut = 0;
  days.forEach((d) => {
    if (flows) {
      const f = flows(toIsoDay(d));
      totalIn += f.in;
      totalOut += f.out;
    }
  });

  const monthTitle = new Date(bounds.year, bounds.monthIndex, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Month Navigation & Summary Totals Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(bounds.prev)}
            aria-label="Previous month"
            className="p-1.5 rounded-xl hover:bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="min-w-36 text-center font-bold text-sm text-[var(--fg)] tracking-tight">
            {monthTitle}
          </h3>
          <button
            type="button"
            onClick={() => onMonthChange(bounds.next)}
            aria-label="Next month"
            className="p-1.5 rounded-xl hover:bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {currentMonth !== thisMonthIso && (
            <button
              type="button"
              onClick={() => onMonthChange(thisMonthIso)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg)] border border-[var(--border)] transition ml-1"
            >
              Today
            </button>
          )}
        </div>

        {/* Inflow / Outflow Totals */}
        <div className="flex items-center gap-3 text-xs tabular font-medium">
          <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
            <span className="w-2 h-2 rounded-xs bg-emerald-500" />
            <span>+{formatAmount(totalIn)} in</span>
          </span>
          <span className="text-[var(--border-strong)]">•</span>
          <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
            <span className="w-2 h-2 rounded-xs bg-sky-400" />
            <span>-{formatAmount(totalOut)} spent</span>
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs relative">
        <div className="grid grid-cols-7 min-w-[640px]">
          {/* Weekday column headers */}
          {weekdays.map((w) => (
            <div
              key={w}
              className="border-b border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--fg-muted)] text-center bg-[var(--surface-2)]/60"
            >
              {w}
            </div>
          ))}

          {/* Lead days padding */}
          {Array.from({ length: leadDays }, (_, i) => (
            <div key={`lead-${i}`} className="border-b border-r border-[var(--border)] bg-[var(--surface-2)]/30 min-h-24 sm:min-h-28" />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const dateStr = toIsoDay(day);
            const isToday = dateStr === todayIso;
            const dayChips = chips(dateStr);
            const flow = flows ? flows(dateStr) : { in: 0, out: 0 };
            const net = flow.in - flow.out;
            const shownChips = dayChips.slice(0, 3);
            const remainingCount = dayChips.length - shownChips.length;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDayForMenu(dateStr)}
                role="button"
                tabIndex={0}
                className={cn(
                  'relative flex flex-col gap-1 border-b border-r border-[var(--border)] p-2 min-h-24 sm:min-h-28 text-left transition cursor-pointer hover:bg-[var(--surface-2)]/80 group',
                  isToday && 'bg-emerald-500/5',
                  selectedDayForMenu === dateStr && 'ring-2 ring-emerald-500/50 z-10'
                )}
              >
                {/* Net flow tint indicator */}
                {net !== 0 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-0 pointer-events-none opacity-5 transition-opacity group-hover:opacity-10',
                      net > 0 ? 'bg-emerald-500' : 'bg-sky-500'
                    )}
                  />
                )}

                {/* Date header and net amount */}
                <div className="flex items-baseline justify-between gap-1 text-xs">
                  <span
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs',
                      isToday
                        ? 'bg-emerald-500 text-white font-bold'
                        : 'text-[var(--fg)] group-hover:text-emerald-400'
                    )}
                  >
                    {day.getDate()}
                  </span>

                  {/* Day Flow Indicators */}
                  {(flow.in > 0 || flow.out > 0) && (
                    <div className="flex flex-col items-end text-[10px] tabular leading-tight font-medium">
                      {flow.in > 0 && <span className="text-emerald-400">+{formatAmount(flow.in)}</span>}
                      {flow.out > 0 && <span className="text-sky-400">-{formatAmount(flow.out)}</span>}
                    </div>
                  )}
                </div>

                {/* Day Chips */}
                <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                  {shownChips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.title || c.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        c.onOpen?.();
                      }}
                      className={cn(
                        'truncate text-[10px] font-medium px-1.5 py-0.5 rounded text-left transition border',
                        c.tone === 'good'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          : c.tone === 'critical'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                          : c.tone === 'warning'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                          : 'bg-[var(--surface-2)] text-[var(--fg)] border-[var(--border)] hover:border-[var(--fg-muted)]'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                  {remainingCount > 0 && (
                    <span className="text-[10px] text-[var(--fg-muted)] font-medium px-1">
                      +{remainingCount} more
                    </span>
                  )}
                </div>

                {/* Hover Add Prompt */}
                <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-1 right-1">
                  <span className="w-5 h-5 rounded-full bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)]">
                    <Plus className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-2)]/40 flex flex-wrap items-center justify-between text-xs text-[var(--fg-muted)] gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
              <span>Money in</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-400" />
              <span>Money out</span>
            </span>
            <span className="text-[11px] text-[var(--fg-muted)] hidden sm:inline">
              Click any date to add or edit an entry (Confluence style)
            </span>
          </div>
        </div>

        {/* Confluence-Style Date Action Modal / Popover */}
        {selectedDayForMenu && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedDayForMenu(null);
            }}
          >
            <div
              ref={menuRef}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl animate-scale-in space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <div>
                  <h4 className="text-sm font-bold text-[var(--fg)]">
                    {parseIsoDate(selectedDayForMenu).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h4>
                  <p className="text-[11px] text-[var(--fg-muted)]">Manage entries for this date</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDayForMenu(null)}
                  className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Existing items on this day */}
              {chips(selectedDayForMenu).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                    Entries on this day ({chips(selectedDayForMenu).length})
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {chips(selectedDayForMenu).map((chip) => (
                      <div
                        key={chip.id}
                        onClick={() => {
                          setSelectedDayForMenu(null);
                          chip.onOpen?.();
                        }}
                        className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] cursor-pointer text-xs transition"
                      >
                        <span className="truncate text-[var(--fg)] font-medium">{chip.label}</span>
                        <Edit2 className="w-3 h-3 text-[var(--fg-muted)] ml-2 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  Actions for this date
                </span>

                {onAddTransactionOnDate && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const date = selectedDayForMenu;
                        setSelectedDayForMenu(null);
                        onAddTransactionOnDate(date, 'EXPENSE');
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-[var(--border)]"
                    >
                      <Plus className="w-3.5 h-3.5 text-rose-500" />
                      <span>Record Expense on this date</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const date = selectedDayForMenu;
                        setSelectedDayForMenu(null);
                        onAddTransactionOnDate(date, 'INCOME');
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-[var(--border)]"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Record Income on this date</span>
                    </button>
                  </>
                )}

                {onAddBillOnDate && (
                  <button
                    type="button"
                    onClick={() => {
                      const date = selectedDayForMenu;
                      setSelectedDayForMenu(null);
                      onAddBillOnDate(date);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-[var(--border)]"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add upcoming bill due on this date</span>
                  </button>
                )}

                {onSelectDateForFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      const date = selectedDayForMenu;
                      setSelectedDayForMenu(null);
                      onSelectDateForFilter(date);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-[var(--border)]"
                  >
                    <List className="w-3.5 h-3.5 text-sky-400" />
                    <span>Filter transactions list to this date</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
