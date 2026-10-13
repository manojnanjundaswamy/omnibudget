import {
  Account,
  BudgetEnvelope,
  Transaction,
  SplitGroup,
  PeerDebt,
  DebtSimplificationResponse,
  Household,
  Subscription,
  DashboardSummary,
  SmartOffsetResponse,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  // Accounts
  getAccounts: async (): Promise<Account[]> => {
    const res = await fetch(`${API_BASE}/accounts`);
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  },

  createAccount: async (data: Partial<Account>): Promise<Account> => {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create account');
    return res.json();
  },

  transferFunds: async (data: {
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    description?: string;
    date?: string;
  }): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/accounts/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Transfer failed');
    return res.json();
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const res = await fetch(`${API_BASE}/transactions`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  createTransaction: async (data: any): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record transaction');
    return res.json();
  },

  // Budget Envelopes
  getEnvelopes: async (): Promise<BudgetEnvelope[]> => {
    const res = await fetch(`${API_BASE}/budgets/envelopes`);
    if (!res.ok) throw new Error('Failed to fetch budget envelopes');
    return res.json();
  },

  updateEnvelopeBudget: async (id: string, monthlyBudget: number): Promise<BudgetEnvelope> => {
    const res = await fetch(`${API_BASE}/budgets/envelopes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyBudget }),
    });
    if (!res.ok) throw new Error('Failed to update envelope budget');
    return res.json();
  },

  rebalanceEnvelopes: async (sourceId: string, targetId: string, amount: number): Promise<{ message: string }> => {
    const res = await fetch(
      `${API_BASE}/budgets/rebalance?sourceEnvelopeId=${sourceId}&targetEnvelopeId=${targetId}&amount=${amount}`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error('Failed to rebalance envelopes');
    return res.json();
  },

  autoAllocateIncome: async (totalIncome: number): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/budgets/auto-allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalIncome }),
    });
    if (!res.ok) throw new Error('Failed to auto allocate income');
    return res.json();
  },

  // Splits & Peer Debts
  getSplitGroups: async (): Promise<SplitGroup[]> => {
    const res = await fetch(`${API_BASE}/splits/groups`);
    if (!res.ok) throw new Error('Failed to fetch split groups');
    return res.json();
  },

  getPeerDebts: async (groupId?: string): Promise<PeerDebt[]> => {
    const url = groupId ? `${API_BASE}/splits/debts?groupId=${groupId}` : `${API_BASE}/splits/debts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch peer debts');
    return res.json();
  },

  getSimplifiedDebts: async (groupId?: string): Promise<DebtSimplificationResponse> => {
    const url = groupId ? `${API_BASE}/splits/simplify?groupId=${groupId}` : `${API_BASE}/splits/simplify`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to simplify debts');
    return res.json();
  },

  settleDebt: async (data: {
    fromUser: string;
    toUser: string;
    amount: number;
    splitGroupId?: string;
    targetAccountId?: string;
  }): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/splits/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to settle debt');
    return res.json();
  },

  // Household
  getHousehold: async (): Promise<Household> => {
    const res = await fetch(`${API_BASE}/household`);
    if (!res.ok) throw new Error('Failed to fetch household');
    return res.json();
  },

  updateHouseholdSalaries: async (data: {
    salaryA: number;
    salaryB: number;
    jointTarget: number;
  }): Promise<Household> => {
    const res = await fetch(`${API_BASE}/household/salaries`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update household salaries');
    return res.json();
  },

  executeCrossOffset: async (amount: number): Promise<SmartOffsetResponse> => {
    const res = await fetch(`${API_BASE}/household/cross-offset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to execute smart cross offset');
    return res.json();
  },

  // Subscriptions
  getSubscriptions: async (): Promise<Subscription[]> => {
    const res = await fetch(`${API_BASE}/subscriptions`);
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json();
  },

  // Sandbox Simulator
  resetSandboxDemo: async (): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/sandbox/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset sandbox');
    return res.json();
  },

  simulatePaycheck: async (): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/sandbox/simulate-paycheck`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to simulate paycheck');
    return res.json();
  },

  simulateExpense: async (): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/sandbox/simulate-expense`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to simulate expense');
    return res.json();
  },
};
