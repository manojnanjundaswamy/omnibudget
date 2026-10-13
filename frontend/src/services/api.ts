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
  User,
  AuthResponse,
  OnboardingPayload,
  TransactionFilter,
  CreateAccountPayload,
  UpdateAccountPayload,
  CreateEnvelopePayload,
  UpdateEnvelopePayload,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  CreateSubscriptionPayload,
  UpdateSubscriptionPayload,
  CreateGroupPayload,
  Goal,
  CreateGoalPayload,
  UpdateGoalPayload,
} from '../types';

const API_BASE = '/api';

const getHeaders = (extra: Record<string, string> = {}) => {
  const userId = localStorage.getItem('omnibudget_user_id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (userId) {
    headers['X-User-Id'] = userId;
  }
  return headers;
};

export const api = {
  // Auth & Multi-Tenancy
  googleAuth: async (data: { email: string; name?: string; avatarUrl?: string }): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Google authentication failed');
    return res.json();
  },

  emailAuth: async (data: { email: string; password?: string; name?: string; isRegister?: boolean }): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Email authentication failed');
    return res.json();
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  completeOnboarding: async (data: OnboardingPayload): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/onboarding`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to complete onboarding');
    return res.json();
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  // Accounts
  getAccounts: async (): Promise<Account[]> => {
    const res = await fetch(`${API_BASE}/accounts`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  },

  createAccount: async (data: CreateAccountPayload): Promise<Account> => {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create account');
    return res.json();
  },

  updateAccount: async (id: string, data: UpdateAccountPayload): Promise<Account> => {
    const res = await fetch(`${API_BASE}/accounts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update account');
    return res.json();
  },

  deleteAccount: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/accounts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete account');
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
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Transfer failed');
    return res.json();
  },

  // Envelopes / Budgets
  getEnvelopes: async (): Promise<BudgetEnvelope[]> => {
    const res = await fetch(`${API_BASE}/budgets/envelopes`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch envelopes');
    return res.json();
  },

  createEnvelope: async (data: CreateEnvelopePayload): Promise<BudgetEnvelope> => {
    const res = await fetch(`${API_BASE}/budgets/envelopes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create envelope');
    return res.json();
  },

  updateEnvelope: async (id: string, data: UpdateEnvelopePayload): Promise<BudgetEnvelope> => {
    const res = await fetch(`${API_BASE}/budgets/envelopes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update envelope');
    return res.json();
  },

  deleteEnvelope: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/budgets/envelopes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete envelope');
    return res.json();
  },

  rebalanceEnvelopes: async (sourceEnvelopeId: string, targetEnvelopeId: string, amount: number) => {
    const params = new URLSearchParams({
      sourceEnvelopeId,
      targetEnvelopeId,
      amount: amount.toString(),
    });
    const res = await fetch(`${API_BASE}/budgets/rebalance?${params}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Rebalance failed');
    return res.json();
  },

  autoAllocateIncome: async (totalIncome: number) => {
    const res = await fetch(`${API_BASE}/budgets/auto-allocate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ totalIncome }),
    });
    if (!res.ok) throw new Error('Auto allocate failed');
    return res.json();
  },

  // Transactions
  getTransactions: async (filter?: TransactionFilter): Promise<Transaction[]> => {
    const query = new URLSearchParams();
    if (filter?.accountId) query.set('accountId', filter.accountId);
    if (filter?.category) query.set('category', filter.category);
    if (filter?.envelopeId) query.set('envelopeId', filter.envelopeId);
    if (filter?.type) query.set('type', filter.type);
    if (filter?.search) query.set('search', filter.search);

    const queryString = query.toString();
    const url = queryString ? `${API_BASE}/transactions?${queryString}` : `${API_BASE}/transactions`;

    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  createTransaction: async (data: CreateTransactionPayload): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record transaction');
    return res.json();
  },

  updateTransaction: async (id: string, data: UpdateTransactionPayload): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  deleteTransaction: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
    return res.json();
  },

  // Subscriptions
  getSubscriptions: async (): Promise<Subscription[]> => {
    const res = await fetch(`${API_BASE}/subscriptions`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json();
  },

  createSubscription: async (data: CreateSubscriptionPayload): Promise<Subscription> => {
    const res = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create subscription');
    return res.json();
  },

  updateSubscription: async (id: string, data: UpdateSubscriptionPayload): Promise<Subscription> => {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update subscription');
    return res.json();
  },

  deleteSubscription: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete subscription');
    return res.json();
  },

  // Splits & Debts
  getSplitGroups: async (): Promise<SplitGroup[]> => {
    const res = await fetch(`${API_BASE}/splits/groups`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch split groups');
    return res.json();
  },

  createSplitGroup: async (data: CreateGroupPayload): Promise<SplitGroup> => {
    const res = await fetch(`${API_BASE}/splits/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create split group');
    return res.json();
  },

  deleteSplitGroup: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/splits/groups/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete split group');
    return res.json();
  },

  getAllDebts: async (): Promise<PeerDebt[]> => {
    const res = await fetch(`${API_BASE}/splits/debts`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch debts');
    return res.json();
  },

  getPeerDebts: async (): Promise<PeerDebt[]> => {
    const res = await fetch(`${API_BASE}/splits/debts`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch debts');
    return res.json();
  },

  getSimplifiedDebts: async (): Promise<DebtSimplificationResponse> => {
    const res = await fetch(`${API_BASE}/splits/simplify`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to simplify debts');
    return res.json();
  },

  settleDebt: async (data: {
    fromUser: string;
    toUser: string;
    amount: number;
    targetAccountId?: string;
  }) => {
    const res = await fetch(`${API_BASE}/splits/settle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Debt settlement failed');
    return res.json();
  },

  // Household
  getHousehold: async (): Promise<Household> => {
    const res = await fetch(`${API_BASE}/household`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch household profile');
    return res.json();
  },

  executeCrossOffset: async (amount: number): Promise<SmartOffsetResponse> => {
    const res = await fetch(`${API_BASE}/household/cross-offset`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Smart cross-offset failed');
    return res.json();
  },

  smartOffset: async (): Promise<SmartOffsetResponse> => {
    const res = await fetch(`${API_BASE}/household/cross-offset`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount: 50.0 }),
    });
    if (!res.ok) throw new Error('Smart offset failed');
    return res.json();
  },

  // Goals (Milestone targets)
  getGoals: async (): Promise<Goal[]> => {
    const res = await fetch(`${API_BASE}/goals`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  createGoal: async (data: CreateGoalPayload): Promise<Goal> => {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create goal');
    return res.json();
  },

  updateGoal: async (id: string, data: UpdateGoalPayload): Promise<Goal> => {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    return res.json();
  },

  deleteGoal: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete goal');
    return res.json();
  },

  // Sandbox simulation triggers
  resetSandboxDemo: async () => {
    const res = await fetch(`${API_BASE}/sandbox/reset`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Reset failed');
    return res.json();
  },

  resetSandbox: async () => {
    const res = await fetch(`${API_BASE}/sandbox/reset`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Reset failed');
    return res.json();
  },

  simulatePaycheck: async () => {
    const res = await fetch(`${API_BASE}/sandbox/simulate/paycheck`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Paycheck simulation failed');
    return res.json();
  },

  simulateExpense: async () => {
    const res = await fetch(`${API_BASE}/sandbox/simulate/expense`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Expense simulation failed');
    return res.json();
  },
};
