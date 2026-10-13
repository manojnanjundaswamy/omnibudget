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
