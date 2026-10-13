import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  Info,
  DollarSign,
  HeartPulse,
} from 'lucide-react';
import { FinancialHealth, CashFlowForecast, AnomalyDetection } from '../types';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

interface FinancialHealthCockpitProps {
  onNavigateTab?: (tab: string) => void;
}

export const FinancialHealthCockpit: React.FC<FinancialHealthCockpitProps> = ({
  onNavigateTab,
}) => {
  const { formatAmount } = useCurrency();
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyDetection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SCORE' | 'FORECAST' | 'ANOMALIES'>('SCORE');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [h, f, a] = await Promise.all([
        api.getFinancialHealth(),
        api.getCashFlowForecast(),
        api.getAnomalies(),
      ]);
      setHealth(h);
      setForecast(f);
      setAnomalies(a);
    } catch (err) {
      console.error('Failed to load financial health telemetry', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading && !health) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-3">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--fg-muted)]" />
        <p className="text-xs text-[var(--fg-muted)]">Analyzing financial invariants and runway...</p>
      </div>
    );
  }

  if (!health) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 65) return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-xs space-y-0 transition-colors">
      {/* Cockpit Header with Mode Switcher */}
      <div className="p-5 border-b border-[var(--border)] bg-[var(--surface-2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[var(--fg)]">Financial Health Cockpit</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getScoreColor(health.score)}`}>
                Score: {health.score}/100 ({health.grade})
              </span>
            </div>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">{health.statusText}</p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('SCORE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'SCORE'
                ? 'bg-[var(--fg)] text-[var(--bg)] font-semibold shadow-xs'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            Pillars & Radar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FORECAST')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'FORECAST'
                ? 'bg-[var(--fg)] text-[var(--bg)] font-semibold shadow-xs'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <span>30-Day Forecast</span>
            {forecast?.riskOfNegativeBalance && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ANOMALIES')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'ANOMALIES'
                ? 'bg-[var(--fg)] text-[var(--bg)] font-semibold shadow-xs'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <span>Anomalies</span>
            {anomalies && anomalies.totalAnomalies > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                {anomalies.totalAnomalies}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: 5 HEALTH PILLARS & ACTIONABLE RECOMMENDATIONS */}
      {activeTab === 'SCORE' && (
        <div className="p-5 space-y-6">
          {/* 5 Pillar Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {health.pillars.map((pillar) => {
              const statusColor =
                pillar.status === 'EXCELLENT'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : pillar.status === 'HEALTHY'
                  ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                  : pillar.status === 'WARNING'
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

              return (
                <div
                  key={pillar.name}
                  className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-[var(--fg)] truncate">{pillar.name}</span>
                      <span className="font-bold text-[var(--fg-muted)] font-mono text-[10px]">
                        {pillar.score}/{pillar.maxScore}
                      </span>
                    </div>

                    <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(pillar.score / pillar.maxScore) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--fg)] tabular-nums">{pillar.metric}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${statusColor}`}>
                        {pillar.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[var(--fg-muted)] leading-relaxed mt-2 pt-2 border-t border-[var(--border)]">
                    {pillar.advice}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--fg)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tailored Action Items to Maximize Your Score</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {health.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--fg)]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 30-DAY PREDICTIVE CASH FLOW FORECAST */}
      {activeTab === 'FORECAST' && forecast && (
        <div className="p-5 space-y-5">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] uppercase font-bold text-[var(--fg-muted)] tracking-wider block">
                Starting Cash
              </span>
              <span className="text-base font-bold text-[var(--fg)] tabular-nums mt-0.5 block">
                {formatAmount(forecast.startingBalance)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] uppercase font-bold text-[var(--fg-muted)] tracking-wider block">
                30-Day Projected Ending
              </span>
              <span className="text-base font-bold text-emerald-400 tabular-nums mt-0.5 block">
                {formatAmount(forecast.endingBalance)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] uppercase font-bold text-[var(--fg-muted)] tracking-wider block">
                Lowest Point (Trough)
              </span>
              <span className={`text-base font-bold tabular-nums mt-0.5 block ${
                forecast.lowestProjectedBalance < 500 ? 'text-amber-400' : 'text-[var(--fg)]'
              }`}>
                {formatAmount(forecast.lowestProjectedBalance)}
              </span>
              <span className="text-[10px] text-[var(--fg-muted)] block">on {forecast.lowestBalanceDate}</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <span className="text-[10px] uppercase font-bold text-[var(--fg-muted)] tracking-wider block">
                Cash Flow Status
              </span>
              <span className={`text-xs font-bold mt-1 inline-flex items-center gap-1 ${
                forecast.riskOfNegativeBalance ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {forecast.riskOfNegativeBalance ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Overdraft Risk Detected</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Safe Runway (Zero Deficits)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* 30-Day Scrollable Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
              <span className="font-semibold text-[var(--fg)]">Daily Cash Trajectory (Next 30 Days)</span>
              <span>Factoring recurring bills, income, and average burn rate</span>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar pr-1">
              {forecast.days.map((day) => {
                const isTrough = day.date === forecast.lowestBalanceDate;
                return (
                  <div
                    key={day.date}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                      isTrough
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : day.status === 'WARNING'
                        ? 'bg-rose-500/5 border-rose-500/20'
                        : 'bg-[var(--surface-2)] border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-[var(--fg-muted)] w-24">
                        {day.date}
                      </span>
                      {day.eventDescription ? (
                        <span className="text-[11px] font-medium text-[var(--fg)] truncate max-w-xs">
                          {day.eventDescription}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--fg-muted)]">Normal variable burn</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {day.inflow > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-400 tabular-nums">
                          +{formatAmount(day.inflow)}
                        </span>
                      )}
                      <span className="font-bold tabular-nums text-xs text-[var(--fg)]">
                        {formatAmount(day.balance)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SMART ANOMALY & DUPLICATE CHARGE HUNTER */}
      {activeTab === 'ANOMALIES' && anomalies && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[var(--fg)]">
                Detected Anomalies ({anomalies.totalAnomalies})
              </h4>
              <p className="text-[11px] text-[var(--fg-muted)]">
                Automated detection of duplicate charges, subscription price hikes, and unexpected outliers.
              </p>
            </div>
            {anomalies.potentialSavings > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                Potential Savings: {formatAmount(anomalies.potentialSavings)}
              </span>
            )}
          </div>

          {anomalies.items.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-[var(--fg)]">No Anomalies Found</p>
              <p className="text-[11px] text-[var(--fg-muted)]">
                All charges and subscription rates align with historical norms.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {anomalies.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 hover:border-[var(--border-strong)] transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        item.severity === 'HIGH'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {item.type.replace('_', ' ')}
                      </span>
                      <h5 className="font-semibold text-xs text-[var(--fg)] mt-1">{item.title}</h5>
                    </div>
                    <span className="font-bold text-xs tabular-nums text-[var(--fg)]">
                      {formatAmount(item.amount)}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px]">
                    <span className="text-[var(--fg-muted)]">{item.suggestedAction}</span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('transactions')}
                      className="text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
