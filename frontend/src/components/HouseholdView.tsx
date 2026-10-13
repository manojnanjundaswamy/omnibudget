import React, { useState } from 'react';
import {
  Users,
  Shield,
  ArrowRightLeft,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Household } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

interface HouseholdViewProps {
  household: Household | null;
  onRefresh: () => void;
}

export const HouseholdView: React.FC<HouseholdViewProps> = ({ household, onRefresh }) => {
  const { formatAmount } = useCurrency();
  const [offsetAmount, setOffsetAmount] = useState('50.00');
  const [offsetResult, setOffsetResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!household) {
    return <div className="p-8 text-center text-[#9e9e98] text-xs">Loading household pool...</div>;
  }

  const handleCrossOffset = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.executeCrossOffset(parseFloat(offsetAmount));
      setOffsetResult(res.summary);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const partnerAShareOfTarget = household.jointMonthlyTarget * household.partnerARatio;
  const partnerBShareOfTarget = household.jointMonthlyTarget * household.partnerBRatio;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)]">{household.name}</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Fair shared expenses and household contributions based on income
          </p>
        </div>

        <div className="text-right">
          <span className="text-[var(--fg-muted)] text-[11px] block">Joint Pool Reserve</span>
          <span className="text-2xl font-bold text-emerald-400 tabular">
            {formatAmount(household.jointPoolBalance)}
          </span>
        </div>
      </div>

      {/* Proportional Contribution Grid */}
      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="font-semibold text-[var(--fg)] text-xs uppercase tracking-wider">
              Proportional Split
            </h3>
            <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
              Household expenses split equitably based on what each person earns
            </p>
          </div>
          <span className="text-xs font-semibold tabular text-[var(--fg)]">
            Monthly Target: {formatAmount(household.jointMonthlyTarget)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Partner A */}
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--fg)] text-sm">{household.partnerAName}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)]">
                {(household.partnerARatio * 100).toFixed(0)}% Share
              </span>
            </div>
            <div className="text-xs text-[var(--fg-muted)]">
              Earnings: <strong className="text-[var(--fg)]">{formatAmount(household.partnerASalary)}/mo</strong>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex justify-between items-center text-xs">
              <span className="text-[var(--fg-muted)]">Monthly Contribution:</span>
              <span className="font-bold text-[var(--fg)] text-sm tabular">
                {formatAmount(partnerAShareOfTarget)}
              </span>
            </div>
          </div>

          {/* Partner B */}
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--fg)] text-sm">{household.partnerBName}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)]">
                {(household.partnerBRatio * 100).toFixed(0)}% Share
              </span>
            </div>
            <div className="text-xs text-[var(--fg-muted)]">
              Earnings: <strong className="text-[var(--fg)]">{formatAmount(household.partnerBSalary)}/mo</strong>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex justify-between items-center text-xs">
              <span className="text-[var(--fg-muted)]">Monthly Contribution:</span>
              <span className="font-bold text-[var(--fg)] text-sm tabular">
                {formatAmount(partnerBShareOfTarget)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Bottom Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Dependent / Kid Allowance Guardrails */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--fg)] text-xs uppercase tracking-wider">
              Allowance & Dependents
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg-muted)]">
              Monitored
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-[var(--fg)] text-sm block">
                  {household.dependentName || 'Leo'}
                </span>
                <span className="text-[11px] text-[var(--fg-subtle)]">Personal spending allowance</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[var(--fg-muted)] block">Available</span>
                <span className="text-lg font-bold text-emerald-400 tabular">
                  {formatAmount(household.dependentBalance)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex justify-between text-xs text-[var(--fg-muted)]">
              <span>Monthly budget: {formatAmount(household.dependentAllowance)}</span>
              <span className="text-emerald-400">Chores completed: +$10</span>
            </div>
          </div>
        </div>

        {/* Smart Cross-Ledger Offset Algorithm */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--fg)] text-xs uppercase tracking-wider">
              Smart Debt Offset
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg-muted)]">
              Zero-Transfer
            </span>
          </div>

          <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
            If {household.partnerBName} owes {household.partnerAName} for a purchase, {household.partnerBName} can deposit it into the joint pool instead, settling the debt without sending money back and forth.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={offsetAmount}
              onChange={(e) => setOffsetAmount(e.target.value)}
              placeholder="50.00"
              className="w-28 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--fg)] text-xs font-semibold focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={handleCrossOffset}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Offsetting...' : 'Execute Offset'}
            </button>
          </div>

          {offsetResult && (
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{offsetResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
