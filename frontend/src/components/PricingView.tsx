import React, { useState, useEffect } from 'react';
import {
  Check,
  Zap,
  Sparkles,
  Users,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { BillingPlan, SubscriptionSummary } from '../types';
import { api } from '../services/api';

interface PricingViewProps {
  currentPlanId?: string;
  onPlanChanged?: () => void;
  formatCurrency: (amount: number) => string;
}

export const PricingView: React.FC<PricingViewProps> = ({
  formatCurrency,
  onPlanChanged,
}) => {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subSummary, setSubSummary] = useState<SubscriptionSummary | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansData, subData] = await Promise.all([
        api.getPlansCatalog(),
        api.getSubscriptionSummary(),
      ]);
      setPlans(plansData);
      setSubSummary(subData);
      if (subData.billingCycle) {
        setBillingCycle(subData.billingCycle);
      }
    } catch (err) {
      console.error('Error loading billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (targetPlanId: 'STARTER' | 'PRO' | 'HOUSEHOLD') => {
    if (subSummary?.planId === targetPlanId && subSummary?.billingCycle === billingCycle) {
      return;
    }
    setIsUpgrading(true);
    setSuccessMessage(null);
    try {
      const updated = await api.upgradePlan({
        plan: targetPlanId,
        billingCycle: billingCycle,
      });
      setSubSummary(updated);
      setSuccessMessage(`Successfully switched to ${updated.planName} Plan (${updated.billingCycle.toLowerCase()})!`);
      if (onPlanChanged) onPlanChanged();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to change plan:', err);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">Loading plan options & entitlements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SaaS Pricing & Entitlements</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
          Simple, Transparent Financial Mastery
        </h1>
        <p className="text-sm lg:text-base text-zinc-400">
          Engineered for modern personal and household finances. Zero ads, zero selling of your financial data.
        </p>

        {/* Success toast */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium flex items-center justify-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Monthly / Annual Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span
            className={`text-sm font-medium cursor-pointer transition-colors ${
              billingCycle === 'MONTHLY' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => setBillingCycle('MONTHLY')}
          >
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(b => (b === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY'))}
            className="w-14 h-8 bg-zinc-800 rounded-full p-1 border border-zinc-700 relative transition-colors focus:outline-none"
          >
            <div
              className={`w-6 h-6 rounded-full bg-indigo-500 transition-transform ${
                billingCycle === 'ANNUAL' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <div
            className={`flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
              billingCycle === 'ANNUAL' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => setBillingCycle('ANNUAL')}
          >
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              Save 34%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map(plan => {
          const isCurrent = subSummary?.planId === plan.id;
          const price = billingCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
          const monthlyEquivalent =
            billingCycle === 'ANNUAL' && plan.annualPrice > 0
              ? (plan.annualPrice / 12).toFixed(2)
              : null;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl flex flex-col justify-between p-6 transition-all duration-200 border ${
                plan.isPopular
                  ? 'bg-gradient-to-b from-indigo-950/30 via-zinc-900 to-zinc-900 border-indigo-500/40 shadow-xl shadow-indigo-950/20 ring-1 ring-indigo-500/30'
                  : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold tracking-wide uppercase shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {plan.id === 'STARTER' && <Layers className="w-5 h-5 text-zinc-400" />}
                    {plan.id === 'PRO' && <Zap className="w-5 h-5 text-indigo-400" />}
                    {plan.id === 'HOUSEHOLD' && <Users className="w-5 h-5 text-amber-400" />}
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                      Current Plan
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mt-2 min-h-[36px]">{plan.tagline}</p>

                {/* Price */}
                <div className="mt-5 pb-5 border-b border-zinc-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      {price === 0 ? 'Free' : formatCurrency(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-xs text-zinc-400 font-medium">
                        /{billingCycle === 'ANNUAL' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {monthlyEquivalent && (
                    <p className="text-xs text-indigo-400 mt-1 font-medium">
                      Equivalent to {formatCurrency(parseFloat(monthlyEquivalent))}/month billed annually
                    </p>
                  )}
                </div>

                {/* Features List */}
                <ul className="mt-6 space-y-3 text-xs text-zinc-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-indigo-400" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                <button
                  type="button"
                  disabled={isUpgrading || (isCurrent && subSummary?.billingCycle === billingCycle)}
                  onClick={() => handleSelectPlan(plan.id as any)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrent && subSummary?.billingCycle === billingCycle
                      ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-default'
                      : plan.isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                  }`}
                >
                  {isCurrent && subSummary?.billingCycle === billingCycle ? (
                    <>
                      <Check className="w-4 h-4" />
                      Active Plan
                    </>
                  ) : (
                    <>
                      <span>{plan.id === 'STARTER' ? 'Downgrade to Starter' : `Select ${plan.name}`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resource Quotas & Usage Meter */}
      {subSummary && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Active Subscription Entitlements
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                You are currently on the <span className="text-white font-semibold">{subSummary.planName} Plan</span>{' '}
                ({subSummary.billingCycle.toLowerCase()}). Next billing cycle renews on{' '}
                <span className="text-zinc-300">{new Date(subSummary.renewsAt).toLocaleDateString()}</span>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                {subSummary.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-5">
            {/* Accounts */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Financial Accounts</span>
                <span className="font-semibold text-white">
                  {subSummary.accountsUsed} / {subSummary.accountsLimit > 100 ? 'Unlimited' : subSummary.accountsLimit}
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (subSummary.accountsUsed / (subSummary.accountsLimit > 100 ? 20 : subSummary.accountsLimit)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Budgets */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Category Budgets</span>
                <span className="font-semibold text-white">
                  {subSummary.budgetsUsed} / {subSummary.budgetsLimit > 100 ? 'Unlimited' : subSummary.budgetsLimit}
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (subSummary.budgetsUsed / (subSummary.budgetsLimit > 100 ? 20 : subSummary.budgetsLimit)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Financial Wealth Goals</span>
                <span className="font-semibold text-white">
                  {subSummary.goalsUsed} / {subSummary.goalsLimit > 100 ? 'Unlimited' : subSummary.goalsLimit}
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (subSummary.goalsUsed / (subSummary.goalsLimit > 100 ? 10 : subSummary.goalsLimit)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Transaction Auto-Rules</span>
                <span className="font-semibold text-white">
                  {subSummary.rulesUsed} Active ({subSummary.rulesEnabled ? 'Enabled' : 'Locked'})
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    subSummary.rulesEnabled ? 'bg-purple-500' : 'bg-zinc-700'
                  }`}
                  style={{ width: `${subSummary.rulesEnabled ? Math.min(100, subSummary.rulesUsed * 20) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Comparison Matrix */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 overflow-x-auto">
        <h2 className="text-base font-bold text-white mb-4">Complete Feature & Competitor Benchmark Matrix</h2>
        <table className="w-full text-left text-xs text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px]">
              <th className="py-3 pr-4 font-semibold">Capability</th>
              <th className="py-3 px-4 font-semibold text-center">Starter ($0)</th>
              <th className="py-3 px-4 font-semibold text-center text-indigo-400">Pro ($9.99/mo)</th>
              <th className="py-3 pl-4 font-semibold text-center text-amber-400">Household ($14.99/mo)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-medium">
            <tr>
              <td className="py-3 pr-4 text-white">Accounts & Multi-Institution Aggregation</td>
              <td className="py-3 px-4 text-center text-zinc-400">3 Accounts</td>
              <td className="py-3 px-4 text-center text-white font-bold">Unlimited</td>
              <td className="py-3 pl-4 text-center text-white font-bold">Unlimited</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-white">50/30/20 Category Spending Budgets</td>
              <td className="py-3 px-4 text-center text-zinc-400">5 Budgets</td>
              <td className="py-3 px-4 text-center text-white font-bold">Unlimited</td>
              <td className="py-3 pl-4 text-center text-white font-bold">Unlimited</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-white">Monarch-Style Cash Flow Engine & Savings Rate %</td>
              <td className="py-3 px-4 text-center text-zinc-400">Basic Summary</td>
              <td className="py-3 px-4 text-center text-emerald-400 font-bold">Full Engine</td>
              <td className="py-3 pl-4 text-center text-emerald-400 font-bold">Full Engine + Forecast</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-white">Automated Transaction Categorization Rules</td>
              <td className="py-3 px-4 text-center text-zinc-600">—</td>
              <td className="py-3 px-4 text-center text-indigo-400 font-bold">Unlimited Rules</td>
              <td className="py-3 pl-4 text-center text-indigo-400 font-bold">Unlimited Rules</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-white">Recurring Subscriptions & Bill Calendar</td>
              <td className="py-3 px-4 text-center text-zinc-400">View only (3)</td>
              <td className="py-3 px-4 text-center text-white font-bold">Full Calendar + Alerts</td>
              <td className="py-3 pl-4 text-center text-white font-bold">Full Calendar + Alerts</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-white">CSV Import / Export (Mint, Monarch, Chase)</td>
              <td className="py-3 px-4 text-center text-zinc-400">Export only</td>
              <td className="py-3 px-4 text-center text-white font-bold">Import + Export</td>
              <td className="py-3 pl-4 text-center text-white font-bold">Priority Batch Processing</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-white">Multiplayer Household Finances (Partner / Spouse)</td>
              <td className="py-3 px-4 text-center text-zinc-600">—</td>
              <td className="py-3 px-4 text-center text-zinc-600">—</td>
              <td className="py-3 pl-4 text-center text-amber-400 font-bold">Joint Collaboration</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-white">Expense Splitting & Debt Settlement (Splitwise built-in)</td>
              <td className="py-3 px-4 text-center text-zinc-600">—</td>
              <td className="py-3 px-4 text-center text-zinc-600">—</td>
              <td className="py-3 pl-4 text-center text-amber-400 font-bold">Smart Simplification</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
