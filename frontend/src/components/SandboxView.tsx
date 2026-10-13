import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  CreditCard,
  Database,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';

interface SandboxViewProps {
  onRefresh: () => void;
}

export const SandboxView: React.FC<SandboxViewProps> = ({ onRefresh }) => {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm('Reset entire sandbox ledger to the default seed dataset?')) return;
    try {
      setIsLoading(true);
      await api.resetSandboxDemo();
      setStatusMsg('Sandbox database restored to clean realistic seed dataset.');
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
      setStatusMsg(`Simulated live paycheck arrival of +$${tx.amount.toFixed(2)} to ${tx.accountName}`);
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
      setStatusMsg(`Simulated real-time card charge of $${tx.grossAmount.toFixed(2)} at ${tx.merchant}`);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-2 border-b border-[#1c1c1c]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f4]">Virtual Banking Sandbox</h2>
          <p className="text-xs text-[#9e9e98] mt-0.5">
            Test live ledger flows, edge-cases, and invariants without external banking APIs
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-[#141414] border border-[#2a2a2a] text-xs text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-[#9e9e98] hover:text-[#f5f5f4]">
            Dismiss
          </button>
        </div>
      )}

      {/* Simulator Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Simulate Paycheck */}
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#242424] space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#262626] text-[#ededed] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-[#f5f5f4] text-xs">Simulate Paycheck (+$4,500)</h3>
            <p className="text-xs text-[#9e9e98] leading-relaxed">
              Triggers a simulated bi-weekly direct deposit into Chase Checking, updating cash flow and safe-to-spend.
            </p>
          </div>

          <button
            onClick={handleSimulateSalary}
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-white text-black text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            Trigger Paycheck Deposit
          </button>
        </div>

        {/* Simulate Expense */}
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#242424] space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#262626] text-[#ededed] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-[#f5f5f4] text-xs">Simulate Card Swipe</h3>
            <p className="text-xs text-[#9e9e98] leading-relaxed">
              Simulates a random real-world debit (Trader Joe's, Blue Bottle coffee, Uber) against linked accounts.
            </p>
          </div>

          <button
            onClick={handleSimulateExpense}
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#f5f5f4] text-xs font-medium border border-[#262626] transition disabled:opacity-50"
          >
            Trigger Card Swipe
          </button>
        </div>

        {/* Reset Sandbox */}
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#242424] space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#262626] text-[#ededed] flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-[#f5f5f4] text-xs">Reset Sandbox State</h3>
            <p className="text-xs text-[#9e9e98] leading-relaxed">
              Restores the default 5-account banking ledger, Lake Tahoe trip group, and 50/30/20 envelope budgets.
            </p>
          </div>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#f5f5f4] text-xs font-medium border border-[#262626] transition disabled:opacity-50"
          >
            Reset to Baseline
          </button>
        </div>
      </div>

      {/* Backend Architecture & H2 Console Info Card */}
      <div className="p-5 rounded-2xl bg-[#121212] border border-[#242424] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#9e9e98]" />
            <h3 className="font-semibold text-xs text-[#f5f5f4]">Database & REST Architecture</h3>
          </div>
          <span className="text-xs text-[#6b6b66] font-mono">Port 8088</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#181818] border border-[#242424] flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-medium text-[#f5f5f4] block">Spring Boot H2 Web Console</span>
            <span className="text-[#9e9e98] text-[11px]">
              JDBC URL: <code className="text-[#f5f5f4] font-mono">jdbc:h2:mem:omnibudget</code> • User:{' '}
              <code className="text-[#9e9e98] font-mono">sa</code>
            </span>
          </div>
          <a
            href="http://localhost:8088/h2-console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242424] text-[#f5f5f4] hover:bg-[#303030] text-xs font-medium"
          >
            <span>Open Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
