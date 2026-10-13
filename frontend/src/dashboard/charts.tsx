import React, { useState } from 'react';

export const SERIES_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

export function getSeriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export function BarList({
  items,
  format,
  onSelect,
}: {
  items: BarListItem[];
  format: (val: number) => string;
  onSelect?: (item: BarListItem) => void;
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return <div className="text-xs text-[#9e9e98] py-4 text-center">No category data recorded yet</div>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, idx) => {
        const color = item.color || getSeriesColor(idx);
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        const widthPercent = (item.value / max) * 100;
        const isHovered = hoverKey === item.key;

        return (
          <li
            key={item.key}
            onClick={() => onSelect?.(item)}
            onMouseEnter={() => setHoverKey(item.key)}
            onMouseLeave={() => setHoverKey(null)}
            className={`group ${onSelect ? 'cursor-pointer hover:opacity-80 transition' : 'cursor-default'}`}
          >
            <div className="flex items-baseline justify-between text-xs mb-1">
              <span className="flex items-center gap-2 truncate pr-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[#f5f5f4] truncate font-medium">{item.label}</span>
              </span>
              <span className="tabular text-[#9e9e98] shrink-0 font-mono text-[11px]">
                {isHovered ? `${percent.toFixed(1)}%` : format(item.value)}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1e1e1e] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(2, widthPercent))}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Progress({
  value,
  color = '#10b981',
}: {
  value: number; // 0 to 1
  color?: string;
}) {
  const percent = Math.min(100, Math.max(0, value * 100));
  return (
    <div className="w-full h-1.5 rounded-full bg-[#1e1e1e] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${percent}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'good' | 'warning' | 'critical';
}) {
  const tones = {
    neutral: 'bg-[#1e1e1e] text-[#9e9e98] border-[#2c2c2c]',
    good: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
