import React, { type ReactNode } from 'react';
import { cn } from './cn';
import { evaluate } from './expr';

export function num(text: string): number | null {
  if (!text.trim()) return null;
  try {
    const v = evaluate(text);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export function rupees(v: number, decimals = 0): string {
  return v.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  hint,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  hint?: string;
  placeholder?: string;
}) {
  const bad = value.trim() !== '' && num(value) === null;
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-[var(--fg)]">{label}</span>
      <span className="relative">
        <input
          id={id}
          aria-label={label}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--fg)] tabular focus:outline-none focus:border-[var(--fg)] transition',
            suffix && 'pr-14',
            bad && 'border-rose-500 text-rose-500'
          )}
          aria-invalid={bad}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[var(--fg-muted)]">
            {suffix}
          </span>
        )}
      </span>
      {hint && <span className="text-[10px] text-[var(--fg-muted)]">{hint}</span>}
    </label>
  );
}

export function Result({
  label,
  value,
  testId,
  children,
}: {
  label: string;
  value: string;
  testId?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-4">
      <span className="text-xs text-[var(--fg-muted)] font-medium">{label}</span>
      <span className="text-2xl font-bold tracking-tight tabular text-[var(--fg)]" data-testid={testId}>
        {value}
      </span>
      {children && <dl className="flex flex-col gap-1.5 text-xs border-t border-[var(--border)] pt-2 mt-1">{children}</dl>}
    </div>
  );
}

export function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-4 text-xs">
      <dt className="text-[var(--fg-muted)]">{label}</dt>
      <dd className={cn('tabular text-[var(--fg)]', strong && 'font-semibold text-emerald-400')}>{value}</dd>
    </div>
  );
}

export function SplitBar({
  a,
  b,
  aLabel,
  bLabel,
}: {
  a: number;
  b: number;
  aLabel: string;
  bLabel: string;
}) {
  const total = a + b || 1;
  const pctA = Math.round((a / total) * 100);
  const pctB = Math.round((b / total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-[var(--surface-3)]"
        role="img"
        aria-label={`${aLabel} ${pctA}%, ${bLabel} ${pctB}%`}
      >
        <span style={{ width: `${(a / total) * 100}%` }} className="bg-indigo-500 rounded-l-full" />
        <span style={{ width: `${(b / total) * 100}%` }} className="bg-emerald-500 rounded-r-full" />
      </div>
      <div className="flex justify-between text-[11px] text-[var(--fg-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-xs bg-indigo-500" />
          {aLabel} {pctA}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-xs bg-emerald-500" />
          {bLabel} {pctB}%
        </span>
      </div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">{children}</p>;
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl gap-1" role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2.5 py-1 rounded-lg text-xs font-medium transition',
            value === opt.value
              ? 'bg-[var(--surface)] text-[var(--fg)] shadow-xs font-semibold'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-emerald-500' : 'bg-[var(--surface-3)]'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}
