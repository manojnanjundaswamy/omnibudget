export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH_WALLET';

export type EnvelopeGroup = 'NEEDS' | 'WANTS' | 'SAVINGS_AND_DEBT';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'GROUP_SPLIT_PAYMENT' | 'SETTLEMENT';

export type TransactionStatus = 'CLEARED' | 'PENDING';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  institutionName?: string;
  accountNumberLast4?: string;
  creditLimit?: number;
  apr?: number;
  statementClosingDay?: number;
  paymentDueDay?: number;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface BudgetEnvelope {
  id: string;
  name: string;
  groupType: EnvelopeGroup;
  targetRatio: number;
  monthlyBudget: number;
  spentAmount: number;
  rolloverSurplus: number;
  rolloverEnabled: boolean;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  amount: number;
  grossAmount: number;
  netPersonalAmount: number;
  receivableAmount: number;
  type: TransactionType;
  category: string;
  envelopeId?: string;
  envelopeName?: string;
  merchant?: string;
  description?: string;
  date: string;
  status: TransactionStatus;
  isRecurring: boolean;
  splitGroupId?: string;
  splitGroupName?: string;
  createdAt: string;
}

export interface SplitGroup {
  id: string;
  name: string;
  description?: string;
  members: string;
  totalExpenses: number;
  createdAt: string;
}

export interface PeerDebt {
  id: string;
  splitGroupId?: string;
  fromUser: string;
  toUser: string;
  amount: number;
  lastUpdated: string;
}

export interface SimplifiedDebtItem {
  fromUser: string;
  toUser: string;
  amount: number;
}

export interface DebtSimplificationResponse {
  simplifiedPayments: SimplifiedDebtItem[];
  originalTransactionCount: number;
  simplifiedTransactionCount: number;
  totalDebtSettled: number;
}

export interface Household {
  id: string;
  name: string;
  partnerAName: string;
  partnerBName: string;
  partnerASalary: number;
  partnerBSalary: number;
  partnerARatio: number;
  partnerBRatio: number;
  jointMonthlyTarget: number;
  jointPoolBalance: number;
  dependentName?: string;
  dependentAllowance?: number;
  dependentBalance?: number;
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cadence: string;
  category?: string;
  nextBillingDate: string;
  accountId?: string;
  accountName?: string;
  isActive: boolean;
}

export interface DashboardSummary {
  netWorth: number;
  totalLiquidAssets: number;
  totalCreditLiabilities: number;
  totalInvestments: number;
  safeToSpend: number;
  totalIncomeThisMonth: number;
  totalExpensesThisMonth: number;
  totalReceivablesIOU: number;
  totalPayablesIOU: number;
  currency: string;
  accountCount: number;
  envelopeCount: number;
}

export interface SmartOffsetResponse {
  partnerAOffset: number;
  partnerBOffset: number;
  newJointBalance: number;
  summary: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  currency: string;
  plan?: string;
  billingCycle?: string;
  subscriptionStatus?: string;
  role?: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED';
  lastLoginAt?: string;
  provider: 'GOOGLE' | 'EMAIL' | 'DEMO';
  hasCompletedOnboarding: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  isNewUser: boolean;
  message?: string;
}

export interface OnboardingPayload {
  currency: string;
  initialAccount?: {
    name: string;
    institutionName?: string;
    type: AccountType;
    balance: number;
  };
  initialEnvelopes?: {
    name: string;
    groupType: EnvelopeGroup;
    monthlyBudget: number;
    icon?: string;
    color?: string;
  }[];
}

export interface TransactionFilter {
  accountId?: string;
  category?: string;
  envelopeId?: string;
  type?: TransactionType;
  search?: string;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  balance: number;
  currency?: string;
  institutionName?: string;
  creditLimit?: number;
  color?: string;
  icon?: string;
}

export interface UpdateAccountPayload {
  name?: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
  institutionName?: string;
  creditLimit?: number;
  color?: string;
  icon?: string;
}

export interface CreateEnvelopePayload {
  name: string;
  groupType: EnvelopeGroup;
  monthlyBudget: number;
  targetRatio?: number;
  color?: string;
  icon?: string;
}

export interface UpdateEnvelopePayload {
  name?: string;
  groupType?: EnvelopeGroup;
  monthlyBudget?: number;
  color?: string;
  icon?: string;
}

export interface CreateTransactionPayload {
  accountId: string;
  amount: number;
  type: TransactionType;
  category: string;
  envelopeId?: string;
  merchant?: string;
  description?: string;
  date?: string;
  splitGroupId?: string;
  splitMembers?: string[];
}

export interface UpdateTransactionPayload {
  accountId?: string;
  amount?: number;
  type?: TransactionType;
  category?: string;
  envelopeId?: string;
  merchant?: string;
  description?: string;
  date?: string;
}

export interface CreateSubscriptionPayload {
  name: string;
  amount: number;
  cadence: string;
  category?: string;
  nextBillingDate: string;
  accountId?: string;
  accountName?: string;
}

export interface UpdateSubscriptionPayload {
  name?: string;
  amount?: number;
  cadence?: string;
  category?: string;
  nextBillingDate?: string;
  accountId?: string;
  accountName?: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  members: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGoalPayload {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  category?: string;
  targetDate?: string;
  color?: string;
  icon?: string;
}

export interface UpdateGoalPayload {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  category?: string;
  targetDate?: string;
  color?: string;
  icon?: string;
}

export interface TransactionRule {
  id: string;
  userId: string;
  name: string;
  matchField: 'DESCRIPTION' | 'MERCHANT';
  matchType: 'CONTAINS' | 'EQUALS' | 'STARTS_WITH';
  matchValue: string;
  applyCategory: string;
  applyMerchant?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRulePayload {
  name: string;
  matchField?: string;
  matchType?: string;
  matchValue: string;
  applyCategory: string;
  applyMerchant?: string;
  isActive?: boolean;
}

export interface UpdateRulePayload {
  name?: string;
  matchField?: string;
  matchType?: string;
  matchValue?: string;
  applyCategory?: string;
  applyMerchant?: string;
  isActive?: boolean;
}

export interface BillingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  maxAccounts: number;
  maxBudgets: number;
  maxGoals: number;
  rulesEngineEnabled: boolean;
  recurringCalendarEnabled: boolean;
  householdCollaborationEnabled: boolean;
  splitSettlementEnabled: boolean;
  features: string[];
  isPopular: boolean;
}

export interface SubscriptionSummary {
  planId: string;
  planName: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  status: string;
  currentPrice: number;
  renewsAt: string;
  accountsUsed: number;
  accountsLimit: number;
  budgetsUsed: number;
  budgetsLimit: number;
  goalsUsed: number;
  goalsLimit: number;
  rulesUsed: number;
  rulesEnabled: boolean;
  householdEnabled: boolean;
  splitSettlementEnabled: boolean;
}

export interface UpgradePlanPayload {
  plan: 'STARTER' | 'PRO' | 'HOUSEHOLD';
  billingCycle: 'MONTHLY' | 'ANNUAL';
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsersToday: number;
  mrr: number;
  arr: number;
  payingSubscribers: number;
  starterUsers: number;
  proUsers: number;
  householdUsers: number;
  totalAccountsTracked: number;
  totalTransactionsProcessed: number;
  totalAssetsUnderManagement: number;
  platformHealth: string;
  databaseEngine: string;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  plan: string;
  billingCycle: string;
  status: 'ACTIVE' | 'SUSPENDED';
  currency: string;
  accountsCount: number;
  transactionsCount: number;
  totalBalance: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateAdminUserPayload {
  email: string;
  name?: string;
  role?: string;
  plan?: string;
  currency?: string;
}

export interface UpdateAdminUserPayload {
  name?: string;
  role?: string;
  plan?: string;
  billingCycle?: string;
  status?: string;
}

export interface ParsedTransaction {
  date: string;
  merchant: string;
  description: string;
  amount: number;
  type: TransactionType;
  suggestedCategory: string;
  ruleMatched?: string;
  confidence: number;
}

export interface IngestCommitPayload {
  accountId: string;
  transactions: ParsedTransaction[];
}

export interface SmartClipPayload {
  text: string;
  accountId?: string;
}

export type AssetType = 'STOCK' | 'SIP' | 'MUTUAL_FUND' | 'CRYPTO' | 'REAL_ESTATE' | 'GOLD' | 'OTHER';

export interface Asset {
  id: string;
  userId: string;
  name: string;
  symbol?: string;
  type: AssetType;
  quantity?: number;
  buyPrice?: number;
  currentPrice?: number;
  investedAmount: number;
  currentValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  sipMonthlyContribution?: number;
  sipDayOfMonth?: number;
  currency: string;
  notes?: string;
  accountId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AssetPortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  totalMonthlySip: number;
  assetCount: number;
  currency: string;
  allocationByType: Record<string, number>;
  assets: Asset[];
}

export interface CreateAssetPayload {
  name: string;
  symbol?: string;
  type: AssetType;
  quantity?: number;
  buyPrice?: number;
  currentPrice?: number;
  investedAmount?: number;
  currentValue?: number;
  sipMonthlyContribution?: number;
  sipDayOfMonth?: number;
  currency?: string;
  notes?: string;
  accountId?: string;
}

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'accounts'
  | 'assets'
  | 'recurring'
  | 'cashflow'
  | 'household'
  | 'goals'
  | 'rules'
  | 'plans'
  | 'settings'
  | 'admin';

export interface TrendPoint {
  month: string;
  monthKey: string;
  income: number;
  expenses: number;
  netSavings: number;
  netWorth: number;
  savingsRate: number;
}

export type NotificationType =
  | 'BILL_DUE'
  | 'BUDGET_WARNING'
  | 'BUDGET_EXCEEDED'
  | 'LOW_BUFFER'
  | 'GOAL_MILESTONE'
  | 'LARGE_TRANSACTION'
  | 'TRANSACTION_ALERT'
  | 'PEER_DEBT_UPDATE'
  | 'SECURITY'
  | 'SYSTEM';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail: string;
  userName: string;
  action: string;
  category: 'AUTH' | 'TRANSACTION' | 'LEDGER' | 'SECURITY' | 'ADMIN' | string;
  description: string;
  metadataJson?: string;
  ipAddress?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY' | string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  targetTab?: NavTab;
  targetId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface HealthPillar {
  name: string;
  score: number;
  maxScore: number;
  status: 'EXCELLENT' | 'HEALTHY' | 'WARNING' | 'CRITICAL';
  metric: string;
  advice: string;
}

export interface FinancialHealth {
  score: number;
  grade: string;
  statusText: string;
  emergencyRunwayMonths: number;
  savingsRatePercent: number;
  debtToAssetRatio: number;
  budgetAdherencePercent: number;
  recurringBurdenPercent: number;
  pillars: HealthPillar[];
  recommendations: string[];
}

export interface ForecastDay {
  date: string;
  dayOfWeek: number;
  balance: number;
  inflow: number;
  outflow: number;
  eventDescription: string;
  status: 'SAFE' | 'WARNING' | 'DANGER';
}

export interface CashFlowForecast {
  startingBalance: number;
  endingBalance: number;
  lowestProjectedBalance: number;
  lowestBalanceDate: string;
  riskOfNegativeBalance: boolean;
  totalExpectedInflow: number;
  totalExpectedOutflow: number;
  days: ForecastDay[];
}

export interface AnomalyItem {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  merchant: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedAction: string;
}

export interface AnomalyDetection {
  totalAnomalies: number;
  potentialSavings: number;
  items: AnomalyItem[];
}



