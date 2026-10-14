import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../cn';
import { GST_RATES, TAX_YEAR, gst, incomeTax, type AgeBand, type Deductions, type TaxResult } from '../finance';
import { Line, Note, NumberField, Segmented, Switch, num, rupees } from '../parts';

export function TaxCalculator() {
  const [income, setIncome] = useState('15L');
  const [salaried, setSalaried] = useState(true);
  const [age, setAge] = useState<AgeBand>('below60');
  const [d, setD] = useState<Record<keyof Deductions, string>>({
    sec80C: '1.5L',
    sec80D: '25k',
    nps80CCD1B: '',
    homeLoanInterest: '',
    hra: '',
    other: '',
  });

  const gross = num(income) ?? 0;
  const deductions: Deductions = {
    sec80C: num(d.sec80C) ?? 0,
    sec80D: num(d.sec80D) ?? 0,
    nps80CCD1B: num(d.nps80CCD1B) ?? 0,
    homeLoanInterest: num(d.homeLoanInterest) ?? 0,
    hra: num(d.hra) ?? 0,
    other: num(d.other) ?? 0,
  };

  const both = gross > 0 ? [incomeTax(gross, 'new', { salaried, age }), incomeTax(gross, 'old', { salaried, age, deductions })] : null;
  const better = both ? (both[0]!.total <= both[1]!.total ? 'new' : 'old') : null;
  const set = (k: keyof Deductions) => (v: string) => setD({ ...d, [k]: v });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField id="tax-income" label="Yearly gross income" value={income} onChange={setIncome} suffix="₹" hint="Salary and other income" />
        <div className="flex flex-col gap-2 text-xs">
          <span className="font-medium text-[var(--fg)]">Age group</span>
          <Segmented
            value={age}
            onChange={setAge}
            options={[
              { value: 'below60', label: 'Under 60' },
              { value: '60to80', label: '60–80' },
              { value: 'above80', label: '80+' },
            ]}
          />
          <label className="flex items-center gap-2 text-[var(--fg-muted)] mt-1">
            <Switch label="Salaried" checked={salaried} onCheckedChange={setSalaried} />
            <span>Salaried (standard deduction)</span>
          </label>
        </div>
      </div>

      <details className="rounded-2xl border border-[var(--border)] p-3 text-xs bg-[var(--surface-2)]">
        <summary className="cursor-pointer font-medium text-[var(--fg)]">Deductions (Old Regime only)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <NumberField id="tax-80c" label="80C (PF, PPF, ELSS)" value={d.sec80C} onChange={set('sec80C')} hint="Max ₹1.5L" />
          <NumberField id="tax-80d" label="80D Mediclaim" value={d.sec80D} onChange={set('sec80D')} hint="Health insurance" />
          <NumberField id="tax-nps" label="NPS 80CCD(1B)" value={d.nps80CCD1B} onChange={set('nps80CCD1B')} hint="Max ₹50k" />
          <NumberField id="tax-home" label="Home loan interest" value={d.homeLoanInterest} onChange={set('homeLoanInterest')} hint="Max ₹2L" />
          <NumberField id="tax-hra" label="HRA exemption" value={d.hra} onChange={set('hra')} />
          <NumberField id="tax-other" label="Other exemptions" value={d.other} onChange={set('other')} />
        </div>
      </details>

      {both && (
        <div className="grid gap-3 sm:grid-cols-2">
          {both.map((t) => (
            <RegimeCard key={t.regime} t={t} best={better === t.regime} />
          ))}
        </div>
      )}

      {both && better && (
        <p className="text-xs text-[var(--fg)] font-medium p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20" data-testid="tax-better">
          The <b className="capitalize text-emerald-400">{better} regime</b> saves you <b className="text-emerald-400">{rupees(Math.abs(both[0]!.total - both[1]!.total))}</b> annually.
        </p>
      )}

      <Note>{TAX_YEAR} Indian income tax provisions. Compare Old vs New regime with full marginal relief calculations.</Note>
    </div>
  );
}

function RegimeCard({ t, best }: { t: TaxResult; best: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border p-4 transition',
        best ? 'border-emerald-500/40 bg-emerald-500/5 shadow-xs' : 'border-[var(--border)] bg-[var(--surface-2)]'
      )}
      data-testid={`tax-${t.regime}`}
    >
      <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
        <span className="font-semibold uppercase tracking-wider text-[10px]">{t.regime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'}</span>
        {best && (
          <span className="flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[10px]">
            <Check className="w-3 h-3" /> Lower Tax
          </span>
        )}
      </div>
      <span className="text-2xl font-bold tracking-tight tabular text-[var(--fg)]">{rupees(t.total)}</span>
      <dl className="flex flex-col gap-1 text-xs border-t border-[var(--border)] pt-2 mt-1">
        <Line label="Taxable income" value={rupees(t.taxable)} />
        {t.rebate > 0 && <Line label="87A Rebate" value={`−${rupees(t.rebate)}`} />}
        {t.surcharge > 0 && <Line label="Surcharge" value={rupees(t.surcharge)} />}
        <Line label="Health & Education Cess (4%)" value={rupees(t.cess)} />
        <Line label="Effective tax rate" value={`${t.effectiveRatePct.toFixed(1)}%`} />
        <Line label="Monthly tax deduction" value={rupees(t.total / 12)} strong />
      </dl>
    </div>
  );
}

export function GstCalculator() {
  const [amount, setAmount] = useState('1,000');
  const [rate, setRate] = useState<string>('18');
  const [inclusive, setInclusive] = useState(false);
  const [interstate, setInterstate] = useState(false);
  const a = num(amount) ?? 0;
  const r = gst(a, num(rate) ?? 0, inclusive);

  return (
    <div className="flex flex-col gap-4">
      <NumberField
        id="gst-amount"
        label={inclusive ? 'Price including GST' : 'Base price before GST'}
        value={amount}
        onChange={setAmount}
        suffix="₹"
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-[var(--fg)]">GST Rate</span>
          <Segmented
            value={rate}
            onChange={setRate}
            options={GST_RATES.map((g) => ({ value: String(g), label: `${g}%` }))}
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--fg-muted)] mt-4">
          <Switch label="Price includes GST" checked={inclusive} onCheckedChange={setInclusive} />
          <span>Amount includes GST</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-[var(--fg-muted)] mt-4">
          <Switch label="Between states" checked={interstate} onCheckedChange={setInterstate} />
          <span>Inter-state (IGST)</span>
        </label>
      </div>

      {a > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-4">
          <span className="text-xs text-[var(--fg-muted)] font-medium">
            {inclusive ? 'Base price before GST' : 'Final price with GST'}
          </span>
          <span className="text-2xl font-bold tracking-tight tabular text-[var(--fg)]">
            {rupees(inclusive ? r.base : r.total, 2)}
          </span>
          <dl className="flex flex-col gap-1 text-xs border-t border-[var(--border)] pt-2 mt-1">
            <Line label="Total GST Amount" value={rupees(r.tax, 2)} strong />
            {interstate ? (
              <Line label={`IGST (${rate}%)`} value={rupees(r.tax, 2)} />
            ) : (
              <>
                <Line label={`CGST (${Number(rate) / 2}%)`} value={rupees(r.cgst, 2)} />
                <Line label={`SGST (${Number(rate) / 2}%)`} value={rupees(r.sgst, 2)} />
              </>
            )}
          </dl>
        </div>
      )}
      <Note>GST 2.0 slabs: 0%, 5%, 18%, and 40% luxury/sin goods.</Note>
    </div>
  );
}
