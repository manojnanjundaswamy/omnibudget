export type WidgetSize = 's' | 'm' | 'l' | 'xl';

export type WidgetType =
  | 'safe-to-spend'
  | 'spending-by-category'
  | 'cash-flow'
  | 'budgets'
  | 'accounts'
  | 'peer-debts'
  | 'household'
  | 'bills-radar'
  | 'recent-transactions';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  size: WidgetSize;
}

export interface WidgetMeta {
  type: WidgetType;
  name: string;
  description: string;
  defaultSize: WidgetSize;
  icon: string;
}

export const WIDGET_CATALOG: Record<WidgetType, WidgetMeta> = {
  'safe-to-spend': {
    type: 'safe-to-spend',
    name: 'Safe-to-Spend',
    description: 'Daily burn rate and spending allowance after fixed commitments',
    defaultSize: 'm',
    icon: 'ShieldCheck',
  },
  'spending-by-category': {
    type: 'spending-by-category',
    name: 'Spending by Category',
    description: 'Ranked breakdown of expenses with category share percentages',
    defaultSize: 'm',
    icon: 'BarChart3',
  },
  'cash-flow': {
    type: 'cash-flow',
    name: 'Monthly Cash Flow',
    description: 'Income vs outlays and net savings rate this month',
    defaultSize: 'm',
    icon: 'TrendingUp',
  },
  'budgets': {
    type: 'budgets',
    name: 'Envelope Budgets',
    description: 'Active envelope limits with progress and overspend alerts',
    defaultSize: 'm',
    icon: 'PiggyBank',
  },
  'accounts': {
    type: 'accounts',
    name: 'Linked Accounts',
    description: 'Liquid cash, credit liabilities, and investment balances',
    defaultSize: 's',
    icon: 'Wallet',
  },
  'peer-debts': {
    type: 'peer-debts',
    name: 'Peer Splits & IOUs',
    description: 'Splitwise simplified debt minimization settlements',
    defaultSize: 's',
    icon: 'Users2',
  },
  'household': {
    type: 'household',
    name: 'Household Pool',
    description: 'Joint family pool balance and 60/40 proportional contribution',
    defaultSize: 's',
    icon: 'Home',
  },
  'bills-radar': {
    type: 'bills-radar',
    name: 'Upcoming Bills Radar',
    description: 'Recurring subscriptions renewal dates and monthly drain',
    defaultSize: 's',
    icon: 'CalendarClock',
  },
  'recent-transactions': {
    type: 'recent-transactions',
    name: 'Recent Ledger Activity',
    description: 'Double-entry personal outlays, payroll, and split bills',
    defaultSize: 'xl',
    icon: 'ListOrdered',
  },
};

export const DEFAULT_DASHBOARD_WIDGETS: WidgetConfig[] = [
  { id: 'w-safe-spend', type: 'safe-to-spend', size: 'm' },
  { id: 'w-category-spend', type: 'spending-by-category', size: 'm' },
  { id: 'w-cash-flow', type: 'cash-flow', size: 'm' },
  { id: 'w-budgets', type: 'budgets', size: 'm' },
  { id: 'w-accounts', type: 'accounts', size: 's' },
  { id: 'w-peer-debts', type: 'peer-debts', size: 's' },
  { id: 'w-household', type: 'household', size: 's' },
  { id: 'w-bills-radar', type: 'bills-radar', size: 's' },
  { id: 'w-recent-tx', type: 'recent-transactions', size: 'xl' },
];
