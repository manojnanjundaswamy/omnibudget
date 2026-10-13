import React, { useState } from 'react';
import {
  Home,
  Users,
  Coins,
  Shield,
  ArrowRightLeft,
  Sparkles,
  CheckCircle2,
  DollarSign,
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
    return <div className="p-8 text-center text-slate-400">Loading household pool...</div>;
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">{household.name}</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Joint Family Pool
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Equitable proportional contribution • Child allowance guardrails • Smart cross-offsets
          </p>
        </div>

        <div className="text-right">
          <span className="text-slate-400 text-xs block">Joint Pool Liquid Reserve</span>
          <span className="text-2xl font-black text-emerald-400">
            {formatAmount(household.jointPoolBalance)}
          </span>
        </div>
      </div>

      {/* Proportional Contribution Grid */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Proportional Partner Contribution Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Household expenses split equitably based on individual salary ratios
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-400">
            Target: {formatAmount(household.jointMonthlyTarget)}/mo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Partner A */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm">{household.partnerAName}</span>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {(household.partnerARatio * 100).toFixed(0)}% Share
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Salary: <strong className="text-slate-200">{formatAmount(household.partnerASalary)}/mo</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Equitable Joint Contribution:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatAmount(partnerAShareOfTarget)}
              </span>
            </div>
          </div>

          {/* Partner B */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm">{household.partnerBName}</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {(household.partnerBRatio * 100).toFixed(0)}% Share
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Salary: <strong className="text-slate-200">{formatAmount(household.partnerBSalary)}/mo</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Equitable Joint Contribution:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatAmount(partnerBShareOfTarget)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Bottom Cards: Dependent Allowance + Smart Cross-Ledger Offsets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dependent / Kid Allowance Guardrails */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Dependent Allowance Guardrail
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Restricted RBAC
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-100 text-sm block">
                  {household.dependentName || 'Leo (Dependent)'}
                </span>
                <span className="text-[11px] text-slate-400">Parent-monitored spending card</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Available Balance</span>
                <span className="text-lg font-black text-emerald-400">
                  {formatAmount(household.dependentBalance)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-400">
              <span>Monthly Allowance: {formatAmount(household.dependentAllowance)}</span>
              <span className="text-indigo-400 font-medium">Chore Rewards: +$10 pending</span>
            </div>
          </div>
        </div>

        {/* Smart Cross-Ledger Offset Algorithm */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-400" /> Smart Cross-Ledger Offset
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Zero-Transfer Settlement
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            If Partner B owes Partner A $50 for dinner, Partner B deposits it directly into the Joint Grocery Pool instead of transferring between accounts, dropping Partner A's grocery obligation by $50!
          </p>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={offsetAmount}
              onChange={(e) => setOffsetAmount(e.target.value)}
              placeholder="50.00"
              className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-bold"
            />
            <button
              onClick={handleCrossOffset}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Offsetting...' : 'Execute Offset'}</span>
            </button>
          </div>

          {offsetResult && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{offsetResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
