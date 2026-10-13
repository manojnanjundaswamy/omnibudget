import React from 'react';
import { Trophy, Plus, ShieldCheck, Home, Plane, Car, Sparkles, Target, Calendar, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Goal } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface GoalsViewProps {
  goals: Goal[];
  onRefresh: () => void;
  onOpenAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  EMERGENCY: ShieldCheck,
  HOME: Home,
  VACATION: Plane,
  PURCHASE: Car,
  RETIREMENT: Sparkles,
  SAVINGS: Target,
};

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onRefresh,
  onOpenAddGoal,
  onEditGoal,
}) => {
  const { formatAmount } = useCurrency();

  const totalTarget = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
  const totalSaved = goals.reduce((acc, g) => acc + (g.currentAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
  const completedCount = goals.filter((g) => g.currentAmount >= g.targetAmount).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Summary Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--fg)]">Savings Goals</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Track what you're saving for, from emergency funds to trips and major purchases.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddGoal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--fg)] hover:opacity-90 text-[var(--bg)] text-xs font-semibold transition active:scale-[0.98] shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
          <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider block">
            Total Saved
          </span>
          <span className="text-2xl font-bold tracking-tight text-emerald-500 tabular block">
            {formatAmount(totalSaved)}
          </span>
          <span className="text-[11px] text-[var(--fg-muted)]">
            Across {goals.length} active goals
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
          <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider block">
            Target Total
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--fg)] tabular block">
            {formatAmount(totalTarget)}
          </span>
          <span className="text-[11px] text-[var(--fg-muted)]">
            {formatAmount(Math.max(0, totalTarget - totalSaved))} remaining to reach target
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
          <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider block">
            Overall Progress
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--fg)] tabular block">
            {overallProgress}%
          </span>
          <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
          <span className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wider block">
            Goals Reached
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-[var(--fg)] tabular block">
              {completedCount} / {goals.length}
            </span>
            {completedCount > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          </div>
          <span className="text-[11px] text-[var(--fg-muted)]">Fully funded goals</span>
        </div>
      </div>

      {/* Goals Cards Grid */}
      {goals.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--fg)] text-sm">No Savings Goals Set Yet</h3>
            <p className="text-xs text-[var(--fg-muted)] mt-1 max-w-sm mx-auto">
              Create your first savings goal, such as an emergency fund, home down payment, or vacation fund.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddGoal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--fg)] text-[var(--bg)] text-xs font-semibold hover:opacity-90 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const Icon = CATEGORY_ICONS[goal.category] || Target;
            const progress = goal.targetAmount > 0
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : 0;
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between space-y-4 shadow-sm group"
              >
                {/* Top Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${goal.color || '#10b981'}15`,
                        borderColor: `${goal.color || '#10b981'}35`,
                        color: goal.color || '#10b981',
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--fg)] text-sm tracking-tight line-clamp-1">
                        {goal.name}
                      </h4>
                      <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider block font-medium">
                        {goal.category || 'SAVINGS'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditGoal(goal)}
                    className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition text-xs font-medium"
                  >
                    Edit
                  </button>
                </div>

                {/* Progress Visual */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-lg text-[var(--fg)] tabular">
                      {formatAmount(goal.currentAmount)}
                    </span>
                    <span className="text-xs text-[var(--fg-muted)] tabular">
                      of {formatAmount(goal.targetAmount)}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: goal.color || '#10b981',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--fg-muted)]">
                    <span className="font-semibold text-[var(--fg)]">{progress}% Funded</span>
                    <span>{formatAmount(remaining)} remaining</span>
                  </div>
                </div>

                {/* Card Footer: Target Date */}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--fg-muted)]">
                  {goal.targetDate ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
                      <span>Target: {goal.targetDate}</span>
                    </div>
                  ) : (
                    <span>Flexible Timeline</span>
                  )}

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEditGoal(goal)}
                      className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition flex items-center gap-0.5"
                    >
                      <span>Update</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
