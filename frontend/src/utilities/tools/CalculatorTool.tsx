import React, { useEffect, useRef, useState } from 'react';
import { Copy, Delete, Check } from 'lucide-react';
import { cn } from '../cn';
import { evaluate, ExprError, formatNumber, type AngleMode } from '../expr';
import { Segmented } from '../parts';

const STD: string[][] = [
  ['C', '(', ')', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['%', '0', '.', '='],
];

const SCI: string[] = ['sin', 'cos', 'tan', 'ln', 'log', '√', 'x²', '^', 'π', 'e', '!', 'Ans', 'L', 'Cr', 'mod'];

const INSERT: Record<string, string> = {
  '√': 'sqrt(',
  'x²': '^2',
  sin: 'sin(',
  cos: 'cos(',
  tan: 'tan(',
  ln: 'ln(',
  log: 'log(',
  Ans: 'ans',
  L: 'L',
  Cr: 'cr',
  mod: ' mod ',
  π: 'π',
};

export function CalculatorTool() {
  const [expr, setExpr] = useState('');
  const [mode, setMode] = useState<AngleMode>('deg');
  const [sci, setSci] = useState(false);
  const [ans, setAns] = useState(0);
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<{ expr: string; value: number }[]>([]);
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  let preview: number | null = null;
  try {
    preview = expr.trim() ? evaluate(expr, mode, ans) : null;
  } catch {
    preview = null;
  }

  function equals() {
    if (!expr.trim()) return;
    try {
      const v = evaluate(expr, mode, ans);
      setHistory((h) => [{ expr, value: v }, ...h].slice(0, 30));
      setAns(v);
      setExpr(String(v));
      setError(undefined);
    } catch (e) {
      setError(e instanceof ExprError ? e.message : 'Calculation error');
    }
  }

  function press(key: string) {
    setError(undefined);
    if (key === 'C') return setExpr('');
    if (key === '=') return equals();
    const text = INSERT[key] ?? (key === '÷' ? '/' : key === '×' ? '*' : key === '−' ? '-' : key);
    setExpr((x) => x + text);
    inputRef.current?.focus();
  }

  const current = preview ?? (expr.trim() ? null : ans);

  function memoryKey(k: 'MC' | 'MR' | 'M+' | 'M−') {
    if (k === 'MC') setMemory(0);
    else if (k === 'MR') setExpr((x) => x + String(memory));
    else if (current !== null) setMemory((m) => m + (k === 'M+' ? current : -current));
  }

  const handleCopy = () => {
    if (current !== null) {
      void navigator.clipboard?.writeText(String(current));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex h-full min-w-0 flex-col gap-3 select-none" data-testid="calculator">
      {/* Display Screen */}
      <div className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-3">
        <input
          ref={inputRef}
          aria-label="Expression"
          value={expr}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => {
            setExpr(e.target.value);
            setError(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === '=') {
              e.preventDefault();
              equals();
            }
            if (e.key === 'Escape') setExpr('');
          }}
          placeholder="25,000 × 12 + 18%"
          className="w-full bg-transparent text-right font-mono text-sm text-[var(--fg-muted)] outline-none"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          {memory !== 0 && (
            <span className="mr-auto text-[11px] font-mono text-[var(--fg-muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
              M = {formatNumber(memory)}
            </span>
          )}
          <output className="truncate text-right text-3xl font-bold tracking-tight tabular text-[var(--fg)]" data-testid="calc-result">
            {error ? <span className="text-xs text-rose-500 font-sans">{error}</span> : current === null ? '…' : formatNumber(current)}
          </output>
          <button
            type="button"
            aria-label="Copy result"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] transition ml-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Segmented
            value={sci ? 'sci' : 'std'}
            onChange={(v) => setSci(v === 'sci')}
            options={[
              { value: 'std', label: 'Standard' },
              { value: 'sci', label: 'Scientific' },
            ]}
          />
          {sci && (
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: 'deg', label: 'Deg' },
                { value: 'rad', label: 'Rad' },
              ]}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpr((x) => x.slice(0, -1))}
          aria-label="Delete last"
          className="p-1.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition border border-[var(--border)]"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>

      {/* Memory Row */}
      <div className="grid grid-cols-4 gap-1.5">
        {(['MC', 'MR', 'M+', 'M−'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => memoryKey(k)}
            className="h-7 rounded-xl text-[11px] font-medium bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] transition"
          >
            {k}
          </button>
        ))}
      </div>

      {/* Scientific Keypad */}
      {sci && (
        <div className="grid grid-cols-5 gap-1.5">
          {SCI.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className="h-8 rounded-xl text-xs font-mono bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--fg)] border border-[var(--border)] transition"
            >
              {k}
            </button>
          ))}
        </div>
      )}

      {/* Standard Keypad */}
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {STD.flat().map((k) => {
          const isOp = ['÷', '×', '−', '+', '='].includes(k);
          const isEq = k === '=';
          const isClear = k === 'C';
          return (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className={cn(
                'min-h-10 rounded-xl text-sm font-semibold transition active:scale-95 flex items-center justify-center border',
                isEq
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                  : isOp
                  ? 'bg-[var(--surface-3)] hover:bg-[var(--border)] text-[var(--fg)] border-[var(--border)]'
                  : isClear
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--fg)] border-[var(--border)]'
              )}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* History Tape Drawer */}
      {history.length > 0 && (
        <details className="mt-1 text-xs">
          <summary className="cursor-pointer text-[var(--fg-muted)] hover:text-[var(--fg)] font-medium">
            History ({history.length})
          </summary>
          <div className="mt-2 max-h-24 overflow-y-auto space-y-1 pr-1 border-t border-[var(--border)] pt-1.5">
            {history.map((h, i) => (
              <div
                key={i}
                onClick={() => setExpr(String(h.value))}
                className="flex justify-between items-center px-2 py-1 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-[11px] font-mono text-[var(--fg-muted)]"
              >
                <span>{h.expr}</span>
                <span className="font-semibold text-[var(--fg)]">= {formatNumber(h.value)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
