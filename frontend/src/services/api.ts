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
  TransactionRule,
  CreateRulePayload,
  UpdateRulePayload,
  BillingPlan,
  SubscriptionSummary,
  UpgradePlanPayload,
  AdminMetrics,
  AdminUserDetail,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  ParsedTransaction,
  IngestCommitPayload,
  SmartClipPayload,
  Asset,
  AssetPortfolioSummary,
  CreateAssetPayload,
  TrendPoint,
  AppNotification,
  AuditLog,
  FinancialHealth,
  CashFlowForecast,
  AnomalyDetection,
  CapturedItem,
  CaptureView,
  PasteCaptureResponse,
  AddCapturedItemPayload,
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

  getCurrentUser: async (userIdOverride?: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(userIdOverride ? { 'X-User-Id': userIdOverride } : {}),
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

  getMonthlyTrends: async (months: number = 6): Promise<TrendPoint[]> => {
    const res = await fetch(`${API_BASE}/dashboard/trends?months=${months}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch financial trends');
    return res.json();
  },

  exportData: async (format: 'csv' | 'json' = 'csv'): Promise<void> => {
    const res = await fetch(`${API_BASE}/ingest/export?format=${format}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to export financial data');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnibudget-export-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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

  // Transaction Rules (Monarch style)
  getRules: async (): Promise<TransactionRule[]> => {
    const res = await fetch(`${API_BASE}/rules`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch transaction rules');
    return res.json();
  },

  createRule: async (data: CreateRulePayload): Promise<TransactionRule> => {
    const res = await fetch(`${API_BASE}/rules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create rule');
    return res.json();
  },

  updateRule: async (id: string, data: UpdateRulePayload): Promise<TransactionRule> => {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update rule');
    return res.json();
  },

  deleteRule: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete rule');
    return res.json();
  },

  runRulesOnAll: async (): Promise<{ totalTransactions: number; updatedCount: number; activeRulesCount: number }> => {
    const res = await fetch(`${API_BASE}/rules/run-all`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to execute rules');
    return res.json();
  },

  // CSV Import & Export
  exportTransactionsCsv: async (): Promise<string> => {
    const res = await fetch(`${API_BASE}/transactions/export-csv`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    return res.text();
  },

  importTransactionsCsv: async (csvContent: string): Promise<{ importedCount: number; skippedCount: number; errors: string[] }> => {
    const res = await fetch(`${API_BASE}/transactions/import-csv`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'text/plain' }),
      body: csvContent,
    });
    if (!res.ok) throw new Error('Failed to import CSV');
    return res.json();
  },

  // Billing & Plans
  getPlansCatalog: async (): Promise<BillingPlan[]> => {
    const res = await fetch(`${API_BASE}/billing/plans`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch billing plans');
    return res.json();
  },

  getSubscriptionSummary: async (): Promise<SubscriptionSummary> => {
    const res = await fetch(`${API_BASE}/billing/subscription`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subscription summary');
    return res.json();
  },

  upgradePlan: async (data: UpgradePlanPayload): Promise<SubscriptionSummary> => {
    const res = await fetch(`${API_BASE}/billing/upgrade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update subscription');
    return res.json();
  },

  // Admin Control Center
  getAdminMetrics: async (): Promise<AdminMetrics> => {
    const res = await fetch(`${API_BASE}/admin/metrics`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch admin metrics');
    return res.json();
  },

  getAdminUsers: async (): Promise<AdminUserDetail[]> => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch users directory');
    return res.json();
  },

  createAdminUser: async (data: CreateAdminUserPayload): Promise<AdminUserDetail> => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },

  updateAdminUser: async (id: string, data: UpdateAdminUserPayload): Promise<AdminUserDetail> => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  deleteAdminUser: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },

  getAdminSettings: async (): Promise<Record<string, any>> => {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch platform settings');
    return res.json();
  },

  updateAdminSettings: async (settings: Record<string, any>): Promise<Record<string, any>> => {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update platform settings');
    return res.json();
  },

  getAuditLogs: async (limit: number = 100, category?: string): Promise<AuditLog[]> => {
    const url = new URL(`${API_BASE}/admin/audit-logs`, window.location.origin);
    url.searchParams.set('limit', String(limit));
    if (category && category !== 'ALL') {
      url.searchParams.set('category', category);
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Zero-Friction Open Ingest Engine
  previewStatementText: async (rawText: string): Promise<ParsedTransaction[]> => {
    const res = await fetch(`${API_BASE}/ingest/statement-preview`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'text/plain' }),
      body: rawText,
    });
    if (!res.ok) throw new Error('Failed to parse statement text');
    return res.json();
  },

  previewOfxContent: async (ofxContent: string): Promise<ParsedTransaction[]> => {
    const res = await fetch(`${API_BASE}/ingest/ofx-preview`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'text/plain' }),
      body: ofxContent,
    });
    if (!res.ok) throw new Error('Failed to parse OFX/QFX content');
    return res.json();
  },

  ingestSmartClip: async (data: SmartClipPayload): Promise<any> => {
    const res = await fetch(`${API_BASE}/ingest/smart-clip`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to process smart clip snippet');
    return res.json();
  },

  commitIngest: async (data: IngestCommitPayload): Promise<{ importedCount: number; accountName: string }> => {
    const res = await fetch(`${API_BASE}/ingest/commit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to commit ingested transactions');
    return res.json();
  },

  // Assets & Investments (SIPs, Stocks, ETFs, Crypto, Gold)
  getAssets: async (): Promise<Asset[]> => {
    const res = await fetch(`${API_BASE}/assets`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  getAssetSummary: async (): Promise<AssetPortfolioSummary> => {
    const res = await fetch(`${API_BASE}/assets/summary`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch portfolio summary');
    return res.json();
  },

  createAsset: async (data: CreateAssetPayload): Promise<Asset> => {
    const res = await fetch(`${API_BASE}/assets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create asset');
    return res.json();
  },

  updateAsset: async (id: string, data: Partial<CreateAssetPayload>): Promise<Asset> => {
    const res = await fetch(`${API_BASE}/assets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update asset');
    return res.json();
  },

  deleteAsset: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/assets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete asset');
  },

  // Notifications & Alerts
  getNotifications: async (): Promise<AppNotification[]> => {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  getUnreadNotificationCount: async (): Promise<number> => {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: getHeaders(),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.unreadCount || 0;
  },

  markNotificationAsRead: async (id: string): Promise<AppNotification> => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  markAllNotificationsAsRead: async (): Promise<void> => {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
  },

  deleteNotification: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete notification');
  },

  clearAllNotifications: async (): Promise<void> => {
    const res = await fetch(`${API_BASE}/notifications/clear-all`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear notifications');
  },

  scanAlerts: async (): Promise<{ alertsCreated: number }> => {
    const res = await fetch(`${API_BASE}/notifications/scan`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to scan alerts');
    return res.json();
  },

  // Auth - Email OTP / Magic Code
  sendOtp: async (email: string, name?: string): Promise<{ message: string; isNewUser: boolean }> => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to send OTP code');
    }
    return res.json();
  },

  verifyOtp: async (email: string, code: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid or expired OTP code');
    }
    return res.json();
  },

  // Financial Analytics Cockpit
  getFinancialHealth: async (): Promise<FinancialHealth> => {
    const res = await fetch(`${API_BASE}/analytics/financial-health`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch financial health');
    return res.json();
  },

  getCashFlowForecast: async (): Promise<CashFlowForecast> => {
    const res = await fetch(`${API_BASE}/analytics/forecast`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch cash flow forecast');
    return res.json();
  },

  getAnomalies: async (): Promise<AnomalyDetection> => {
    const res = await fetch(`${API_BASE}/analytics/anomalies`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch anomalies');
    return res.json();
  },

  // Auto-Capture & Inbound Pipeline
  getCaptureView: async (): Promise<CaptureView> => {
    const res = await fetch(`${API_BASE}/capture`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch capture view');
    return res.json();
  },

  getCaptureCount: async (): Promise<{ pending: number }> => {
    const res = await fetch(`${API_BASE}/capture/count`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch capture count');
    return res.json();
  },

  resetCaptureAddress: async (): Promise<CaptureView> => {
    const res = await fetch(`${API_BASE}/capture/address/reset`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset capture address');
    return res.json();
  },

  pasteCapture: async (data: { text: string; source?: 'PASTE' | 'SHARE' }): Promise<PasteCaptureResponse> => {
    const res = await fetch(`${API_BASE}/capture/paste`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to process pasted capture text');
    return res.json();
  },

  addCapturedItem: async (id: string, data?: AddCapturedItemPayload): Promise<CapturedItem> => {
    const res = await fetch(`${API_BASE}/capture/items/${id}/add`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) throw new Error('Failed to add captured transaction');
    return res.json();
  },

  dismissCapturedItem: async (id: string): Promise<CapturedItem> => {
    const res = await fetch(`${API_BASE}/capture/items/${id}/dismiss`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to dismiss captured item');
    return res.json();
  },

  sendInboundEmailWebhook: async (data: { to: string; from?: string; subject?: string; text: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/capture/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send inbound email webhook');
    return res.json();
  },
};


