import React, { useState } from 'react';
import { ArrowDownUp, Copy, Check } from 'lucide-react';
import { amountInWords } from '../finance';
import { Line, Note, NumberField, Result, Segmented, num, rupees } from '../parts';

const FIRST = ['USD', 'AED', 'EUR', 'GBP', 'SGD', 'SAR', 'CAD', 'AUD', 'JPY', 'QAR', 'KWD', 'OMR', 'BHD'];

const DEFAULT_RATES: Record<string, number> = {
  USD: 0.0116,
  AED: 0.0426,
  EUR: 0.0107,
  GBP: 0.0091,
  SGD: 0.0156,
  SAR: 0.0435,
  CAD: 0.0159,
  AUD: 0.0178,
  JPY: 1.76,
  QAR: 0.0423,
  KWD: 0.00357,
  OMR: 0.00447,
  BHD: 0.00438,
};

export function CurrencyConverter() {
  const [amount, setAmount] = useState('1,000');
  const [other, setOther] = useState('USD');
  const [toInr, setToInr] = useState(false);
  const [manual, setManual] = useState('');

  const a = num(amount) ?? 0;
  const perInr = manual && num(manual) ? 1 / num(manual)! : DEFAULT_RATES[other] || 0.0116;
  const result = perInr ? (toInr ? a / perInr : a * perInr) : null;
  const codes = FIRST;

  const fmt = (v: number, code: string) =>
    v.toLocaleString('en-IN', { style: 'currency', currency: code, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <NumberField
          id="fx-amount"
          label={toInr ? `Amount in ${other}` : 'Amount in ₹'}
          value={amount}
          onChange={setAmount}
        />
        <button
          type="button"
          aria-label="Swap currencies"
          onClick={() => setToInr(!toInr)}
          className="p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-[var(--fg)] self-end flex items-center justify-center transition"
        >
          <ArrowDownUp className="w-4 h-4" />
        </button>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-[var(--fg)]">Currency</span>
          <select
            aria-label="Other currency"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--fg)] focus:outline-none focus:border-[var(--fg)] transition"
          >
            {codes.map((c) => (
              <option key={c} value={c} className="bg-[var(--surface)] text-[var(--fg)]">
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {result !== null && (
        <Result
          label={toInr ? 'In Indian Rupees' : `In ${other}`}
          value={toInr ? rupees(result, 2) : fmt(result, other)}
          testId="fx-result"
        >
          {perInr && <Line label={`1 ${other}`} value={rupees(1 / perInr, 2)} />}
        </Result>
      )}

      <NumberField
        id="fx-manual"
        label={`Custom rate (optional): 1 ${other} in ₹`}
        value={manual}
        onChange={setManual}
        hint="Override with your exact bank or card forex markup rate."
      />
      <Note>Reference forex rate for planning. Cards and bank transfers usually carry 1.5% to 3.5% markup.</Note>
    </div>
  );
}

export function AmountInWords() {
  const [amount, setAmount] = useState('1,50,250.50');
  const [copied, setCopied] = useState(false);
  const a = num(amount);
  const words = a !== null && a >= 0 ? amountInWords(a) : '';

  const handleCopy = () => {
    if (words) {
      void navigator.clipboard?.writeText(words);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <NumberField id="words-amount" label="Amount in numbers" value={amount} onChange={setAmount} suffix="₹" />
      {words && (
        <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-4">
          <span className="text-xs text-[var(--fg-muted)] font-medium">In Indian Cheque / Legal Words:</span>
          <p className="text-sm font-semibold leading-relaxed text-[var(--fg)]" data-testid="words">
            {words}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="self-start mt-2 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-3)] text-xs font-medium text-[var(--fg)] flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to clipboard' : 'Copy words'}</span>
          </button>
        </div>
      )}
      <Note>Standard RBI / Indian banking format with Lakhs, Crores, and Paise for cheques, RTGS, and vouchers.</Note>
    </div>
  );
}

export function BillSplitter() {
  const [bill, setBill] = useState('2,400');
  const [people, setPeople] = useState('4');
  const [tip, setTip] = useState<'0' | '5' | '10' | '15'>('0');

  const b = num(bill) ?? 0;
  const n = Math.max(1, Math.round(num(people) ?? 1));
  const total = b * (1 + Number(tip) / 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField id="split-bill" label="Total bill amount" value={bill} onChange={setBill} suffix="₹" />
        <NumberField id="split-people" label="Number of people" value={people} onChange={setPeople} />
      </div>
      <div className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-[var(--fg)]">Tip percentage</span>
        <Segmented
          value={tip}
          onChange={setTip}
          options={[
            { value: '0', label: 'No tip' },
            { value: '5', label: '5%' },
            { value: '10', label: '10%' },
            { value: '15', label: '15%' },
          ]}
        />
      </div>
      {b > 0 && (
        <Result label="Each person pays" value={rupees(Math.ceil(total / n))} testId="split-each">
          <Line label="Total bill with tip" value={rupees(total)} />
          <Line label="Tip amount" value={rupees(total - b)} />
        </Result>
      )}
      <Note>For recurring or multi-payer room expenses, use the Household & Split groups tab in PayLedger.</Note>
    </div>
  );
}

export function PercentCalculator() {
  const [kind, setKind] = useState<'of' | 'change' | 'discount'>('of');
  const [a, setA] = useState('18');
  const [b, setB] = useState('5,000');

  const x = num(a) ?? 0;
  const y = num(b) ?? 0;
  const value =
    kind === 'of'
      ? (x / 100) * y
      : kind === 'change'
      ? x !== 0
        ? ((y - x) / x) * 100
        : 0
      : y * (1 - x / 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-[var(--fg)]">Calculation type</span>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'of', label: 'X% of Y' },
            { value: 'change', label: '% Change (X → Y)' },
            { value: 'discount', label: 'Y with X% off' },
          ]}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          id="pct-a"
          label={kind === 'change' ? 'Initial value (X)' : 'Percentage (X)'}
          value={a}
          onChange={setA}
          suffix={kind === 'change' ? '' : '%'}
        />
        <NumberField
          id="pct-b"
          label={kind === 'change' ? 'Final value (Y)' : 'Base amount (Y)'}
          value={b}
          onChange={setB}
        />
      </div>
      <Result
        label="Calculated Answer"
        value={
          kind === 'change'
            ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
            : value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
        }
        testId="pct-result"
      />
    </div>
  );
}
