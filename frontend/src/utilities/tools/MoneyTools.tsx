import React, { useState } from 'react';
import { amortize, futureCost, lumpsum, recurringDeposit, sip } from '../finance';
import { Line, Note, NumberField, Result, SplitBar, Segmented, num, rupees } from '../parts';

export function LoanCalculator() {
  const [amount, setAmount] = useState('25L');
  const [rate, setRate] = useState('8.5');
  const [years, setYears] = useState('20');
  const [extra, setExtra] = useState('');
  const p = num(amount) ?? 0;
  const r = num(rate) ?? 0;
  const months = Math.round((num(years) ?? 0) * 12);
  const plan = p > 0 && months > 0 ? amortize(p, r, months) : null;
  const faster = plan && (num(extra) ?? 0) > 0 ? amortize(p, r, months, num(extra)!) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField id="loan-amount" label="Loan amount" value={amount} onChange={setAmount} suffix="₹" hint="e.g. 25L, 5,00,000" />
        <NumberField id="loan-rate" label="Interest" value={rate} onChange={setRate} suffix="% p.a." />
        <NumberField id="loan-years" label="Tenure" value={years} onChange={setYears} suffix="years" />
      </div>
      {plan && (
        <>
          <Result label="Monthly EMI" value={rupees(plan.emi)} testId="emi">
            <Line label="Total interest" value={rupees(plan.totalInterest)} />
            <Line label="Total amount paid" value={rupees(plan.totalPaid)} strong />
          </Result>
          <SplitBar a={p} b={plan.totalInterest} aLabel="Principal" bLabel="Interest" />
          <NumberField id="loan-extra" label="Prepay extra monthly (optional)" value={extra} onChange={setExtra} suffix="₹" />
          {faster && (
            <Result label="With prepayment" value={`${Math.floor(faster.months / 12)}y ${faster.months % 12}m`} testId="loan-faster">
              <Line label="Paid off sooner by" value={`${Math.floor((plan.months - faster.months) / 12)}y ${(plan.months - faster.months) % 12}m`} />
              <Line label="Total interest saved" value={rupees(plan.totalInterest - faster.totalInterest)} strong />
            </Result>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer text-[var(--fg-muted)] hover:text-[var(--fg)] font-medium">Year-by-year schedule</summary>
            <div className="mt-2 max-h-44 overflow-y-auto border border-[var(--border)] rounded-xl">
              <table className="w-full text-[11px] tabular">
                <thead className="bg-[var(--surface-2)] text-[var(--fg-muted)] sticky top-0">
                  <tr>
                    <th className="py-1 px-2 text-left">Year</th>
                    <th className="py-1 px-2 text-right">Principal</th>
                    <th className="py-1 px-2 text-right">Interest</th>
                    <th className="py-1 px-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {plan.years.map((y) => (
                    <tr key={y.year} className="hover:bg-[var(--surface-2)]">
                      <td className="py-1 px-2">{y.year}</td>
                      <td className="py-1 px-2 text-right">{rupees(y.principal)}</td>
                      <td className="py-1 px-2 text-right">{rupees(y.interest)}</td>
                      <td className="py-1 px-2 text-right">{rupees(y.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

export function SipCalculator() {
  const [monthly, setMonthly] = useState('10,000');
  const [ret, setRet] = useState('12');
  const [years, setYears] = useState('15');
  const [step, setStep] = useState('0');
  const m = num(monthly) ?? 0;
  const result = m > 0 ? sip(m, num(ret) ?? 0, num(years) ?? 0, num(step) ?? 0) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField id="sip-monthly" label="Monthly SIP" value={monthly} onChange={setMonthly} suffix="₹" />
        <NumberField id="sip-return" label="Expected return" value={ret} onChange={setRet} suffix="% p.a." />
        <NumberField id="sip-years" label="Investment tenure" value={years} onChange={setYears} suffix="years" />
        <NumberField id="sip-step" label="Annual step-up" value={step} onChange={setStep} suffix="%" hint="Increases investment with salary" />
      </div>
      {result && (
        <>
          <Result label="Maturity Value" value={rupees(result.value)} testId="sip-value">
            <Line label="Invested capital" value={rupees(result.invested)} />
            <Line label="Wealth gain" value={rupees(result.gains)} strong />
          </Result>
          <SplitBar a={result.invested} b={result.gains} aLabel="Invested" bLabel="Gains" />
          <Note>Based on compound growth. Mutual funds are subject to market risks.</Note>
        </>
      )}
    </div>
  );
}

export function FdCalculator() {
  const [amount, setAmount] = useState('1L');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState('5');
  const [compound, setCompound] = useState<'4' | '12' | '1'>('4');
  const p = num(amount) ?? 0;
  const result = p > 0 ? lumpsum(p, num(rate) ?? 0, num(years) ?? 0, Number(compound)) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField id="fd-amount" label="Deposit amount" value={amount} onChange={setAmount} suffix="₹" />
        <NumberField id="fd-rate" label="Interest rate" value={rate} onChange={setRate} suffix="% p.a." />
        <NumberField id="fd-years" label="Tenure" value={years} onChange={setYears} suffix="years" />
      </div>
      <div className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-[var(--fg)]">Compounding frequency</span>
        <Segmented
          value={compound}
          onChange={setCompound}
          options={[
            { value: '4', label: 'Quarterly (FDs)' },
            { value: '12', label: 'Monthly' },
            { value: '1', label: 'Yearly' },
          ]}
        />
      </div>
      {result && (
        <Result label="Maturity amount" value={rupees(result.value)} testId="fd-value">
          <Line label="Principal invested" value={rupees(result.invested)} />
          <Line label="Total interest earned" value={rupees(result.gains)} strong />
        </Result>
      )}
      <Note>Bank fixed deposits typically compound interest on a quarterly basis.</Note>
    </div>
  );
}

export function RdCalculator() {
  const [monthly, setMonthly] = useState('5,000');
  const [rate, setRate] = useState('7');
  const [months, setMonths] = useState('24');
  const m = num(monthly) ?? 0;
  const result = m > 0 ? recurringDeposit(m, num(rate) ?? 0, Math.round(num(months) ?? 0)) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField id="rd-monthly" label="Monthly deposit" value={monthly} onChange={setMonthly} suffix="₹" />
        <NumberField id="rd-rate" label="Interest rate" value={rate} onChange={setRate} suffix="% p.a." />
        <NumberField id="rd-months" label="Tenure" value={months} onChange={setMonths} suffix="months" />
      </div>
      {result && (
        <Result label="Maturity payout" value={rupees(result.value)} testId="rd-value">
          <Line label="Total deposits" value={rupees(result.invested)} />
          <Line label="Interest accrued" value={rupees(result.gains)} strong />
        </Result>
      )}
      <Note>Quarterly compounding as prescribed by RBI for bank recurring deposits.</Note>
    </div>
  );
}

export function InflationCalculator() {
  const [today, setToday] = useState('1L');
  const [rate, setRate] = useState('6');
  const [years, setYears] = useState('10');
  const t = num(today) ?? 0;
  const later = futureCost(t, num(rate) ?? 0, num(years) ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField id="inf-today" label="Cost today" value={today} onChange={setToday} suffix="₹" />
        <NumberField id="inf-rate" label="Inflation rate" value={rate} onChange={setRate} suffix="% p.a." hint="CPI avg 5-6%" />
        <NumberField id="inf-years" label="In future" value={years} onChange={setYears} suffix="years" />
      </div>
      {t > 0 && (
        <Result label="Future required cost" value={rupees(later)} testId="inflation-value">
          <Line label="Today's purchasing power" value={`${Math.round((t / later) * 100)}% of future value`} />
          <Line label="Net erosion" value={rupees(later - t)} strong />
        </Result>
      )}
      <Note>Plan your retirement and milestone funds by accounting for long-term rupee inflation.</Note>
    </div>
  );
}
