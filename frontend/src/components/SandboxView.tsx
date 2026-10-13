import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCcw,
  CreditCard,
  Database,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';

interface SandboxViewProps {
  onRefresh: () => void;
}

export const SandboxView: React.FC<SandboxViewProps> = ({ onRefresh }) => {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm('Reset entire sandbox ledger to the default rich seed dataset?')) return;
    try {
      setIsLoading(true);
      await api.resetSandboxDemo();
      setStatusMsg('Sandbox database restored to clean realistic seed dataset!');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateSalary = async () => {
    try {
      setIsLoading(true);
      const tx = await api.simulatePaycheck();
      setStatusMsg(`Simulated live paycheck arrival of +$${tx.amount.toFixed(2)} to ${tx.accountName}!`);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateExpense = async () => {
    try {
      setIsLoading(true);
      const tx = await api.simulateExpense();
      setStatusMsg(`Simulated real-time card charge of $${tx.grossAmount.toFixed(2)} at ${tx.merchant}!`);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Virtual Banking Sandbox</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live Mock Environment
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test realistic financial flows, edge-cases, and ledger invariants without third-party bank credentials
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Simulator Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Simulate Paycheck */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Simulate Paycheck (+$4,500)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Triggers a simulated bi-weekly engineering direct deposit into your Chase checking account, recalculates cash flow, and updates safe-to-spend.
            </p>
          </div>

          <button
            onClick={handleSimulateSalary}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
          >
            Trigger Paycheck Deposit
          </button>
        </div>

        {/* Simulate Expense */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Simulate Real-time Card Swipe</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulates a random real-world transaction (e.g. Trader Joe's groceries, Blue Bottle coffee, Uber trip) deducting from your accounts.
            </p>
          </div>

          <button
            onClick={handleSimulateExpense}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 disabled:opacity-50 transition"
          >
            Trigger Card Swipe
          </button>
        </div>

        {/* Reset Sandbox */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Reset to Demo Baseline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Wipes testing experiments and restores the rich 5-account banking sandbox, Lake Tahoe trip group, and 50/30/20 envelope budgets.
            </p>
          </div>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition"
          >
            Reset Sandbox State
          </button>
        </div>
      </div>

      {/* Backend Architecture & H2 Console Info Card */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Embedded Database & Architecture Spec</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Port: 8088 (REST API)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Backend Framework</span>
            <span className="font-bold text-slate-200">Spring Boot 4.1.1 (Java 21)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Database Engine</span>
            <span className="font-bold text-slate-200">H2 (PostgreSQL Mode)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Frontend Stack</span>
            <span className="font-bold text-slate-200">React 19 + Tailwind v4 + Vite</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-200 block">Spring Boot H2 Web Console</span>
            <span className="text-slate-400 text-[11px]">
              JDBC URL: <code className="text-indigo-400 font-mono">jdbc:h2:mem:omnibudget</code> • User:{' '}
              <code className="text-slate-300 font-mono">sa</code>
            </span>
          </div>
          <a
            href="http://localhost:8088/h2-console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold text-xs"
          >
            <span>Open H2 Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
