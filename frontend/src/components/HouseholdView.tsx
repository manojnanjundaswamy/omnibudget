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
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[#1c1c1c]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f4]">{household.name}</h2>
          <p className="text-xs text-[#9e9e98] mt-0.5">
            Equitable proportional contribution • Child allowance guardrails • Smart cross-offsets
          </p>
        </div>

        <div className="text-right">
          <span className="text-[#9e9e98] text-[11px] block">Joint Pool Liquid Reserve</span>
          <span className="text-2xl font-bold text-emerald-400 tabular">
            {formatAmount(household.jointPoolBalance)}
          </span>
        </div>
      </div>

      {/* Proportional Contribution Grid */}
      <div className="p-6 rounded-2xl bg-[#121212] border border-[#242424] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
          <div>
            <h3 className="font-semibold text-[#f5f5f4] text-xs uppercase tracking-wider">
              Proportional Partner Contribution
            </h3>
            <p className="text-[11px] text-[#9e9e98] mt-0.5">
              Household expenses split equitably based on individual income
            </p>
          </div>
          <span className="text-xs font-semibold tabular text-[#f5f5f4]">
            Monthly Target: {formatAmount(household.jointMonthlyTarget)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Partner A */}
          <div className="p-4 rounded-xl bg-[#181818] border border-[#242424] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#f5f5f4] text-sm">{household.partnerAName}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#222222] border border-[#2e2e2e] text-[#f5f5f4]">
                {(household.partnerARatio * 100).toFixed(0)}% Share
              </span>
            </div>
            <div className="text-xs text-[#9e9e98]">
              Salary: <strong className="text-[#f5f5f4]">{formatAmount(household.partnerASalary)}/mo</strong>
            </div>
            <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] flex justify-between items-center text-xs">
              <span className="text-[#9e9e98]">Equitable Share:</span>
              <span className="font-bold text-[#f5f5f4] text-sm tabular">
                {formatAmount(partnerAShareOfTarget)}
              </span>
            </div>
          </div>

          {/* Partner B */}
          <div className="p-4 rounded-xl bg-[#181818] border border-[#242424] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#f5f5f4] text-sm">{household.partnerBName}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#222222] border border-[#2e2e2e] text-[#f5f5f4]">
                {(household.partnerBRatio * 100).toFixed(0)}% Share
              </span>
            </div>
            <div className="text-xs text-[#9e9e98]">
              Salary: <strong className="text-[#f5f5f4]">{formatAmount(household.partnerBSalary)}/mo</strong>
            </div>
            <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] flex justify-between items-center text-xs">
              <span className="text-[#9e9e98]">Equitable Share:</span>
              <span className="font-bold text-[#f5f5f4] text-sm tabular">
                {formatAmount(partnerBShareOfTarget)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Bottom Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Dependent / Kid Allowance Guardrails */}
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#242424] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#f5f5f4] text-xs uppercase tracking-wider text-[#9e9e98]">
              Dependent Allowance Guardrail
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181818] border border-[#282828] text-[#9e9e98]">
              Role-Restricted
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#181818] border border-[#242424] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-[#f5f5f4] text-sm block">
                  {household.dependentName || 'Leo (Dependent)'}
                </span>
                <span className="text-[11px] text-[#6b6b66]">Monitored spending allowance</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#9e9e98] block">Available</span>
                <span className="text-lg font-bold text-emerald-400 tabular">
                  {formatAmount(household.dependentBalance)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#242424] flex justify-between text-xs text-[#9e9e98]">
              <span>Monthly budget: {formatAmount(household.dependentAllowance)}</span>
              <span className="text-emerald-400">Chore rewards: +$10</span>
            </div>
          </div>
        </div>

        {/* Smart Cross-Ledger Offset Algorithm */}
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#242424] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#f5f5f4] text-xs uppercase tracking-wider text-[#9e9e98]">
              Smart Cross-Ledger Offset
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181818] border border-[#282828] text-[#9e9e98]">
              Zero-Transfer
            </span>
          </div>

          <p className="text-xs text-[#9e9e98] leading-relaxed">
            If Partner B owes Partner A for dinner, Partner B deposits it directly into the Joint Grocery Pool, canceling the internal debt with zero bank transfers.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={offsetAmount}
              onChange={(e) => setOffsetAmount(e.target.value)}
              placeholder="50.00"
              className="w-28 bg-[#181818] border border-[#262626] rounded-lg px-3 py-1.5 text-[#f5f5f4] text-xs font-semibold"
            />
            <button
              onClick={handleCrossOffset}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Offsetting...' : 'Execute Offset'}
            </button>
          </div>

          {offsetResult && (
            <div className="p-3 rounded-lg bg-[#181818] border border-[#2c2c2c] text-xs text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{offsetResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
