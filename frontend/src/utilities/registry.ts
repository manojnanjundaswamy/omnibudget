import React from 'react';
import {
  Banknote,
  Calculator as CalcIcon,
  Coins,
  FileText,
  Landmark,
  Percent,
  PiggyBank,
  Receipt,
  ReceiptIndianRupee,
  Repeat,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { CalculatorTool } from './tools/CalculatorTool';
import {
  AmountInWords,
  BillSplitter,
  CurrencyConverter,
  PercentCalculator,
} from './tools/EverydayTools';
import {
  FdCalculator,
  InflationCalculator,
  LoanCalculator,
  RdCalculator,
  SipCalculator,
} from './tools/MoneyTools';
import { GstCalculator, TaxCalculator } from './tools/TaxTools';

export type ToolGroup = 'Calculate' | 'Loans & savings' | 'Tax' | 'Everyday';

export interface ToolDef {
  name: string;
  does: string;
  icon: LucideIcon;
  group: ToolGroup;
  component: React.ComponentType;
  size: { w: number; h: number };
}

export const TOOLS = {
  calculator: {
    name: 'Calculator',
    does: 'Standard and scientific, with lakh/crore, memory & history tape.',
    icon: CalcIcon,
    group: 'Calculate',
    component: CalculatorTool,
    size: { w: 360, h: 580 },
  },
  percent: {
    name: 'Percentages',
    does: 'X% of Y, change between two numbers, discount.',
    icon: Percent,
    group: 'Calculate',
    component: PercentCalculator,
    size: { w: 420, h: 420 },
  },
  loan: {
    name: 'Loan EMI',
    does: 'EMI, total interest, year-by-year amortization, prepayment savings.',
    icon: Landmark,
    group: 'Loans & savings',
    component: LoanCalculator,
    size: { w: 520, h: 620 },
  },
  sip: {
    name: 'SIP Wealth',
    does: 'Monthly SIP compound growth, with annual step-up %.',
    icon: TrendingUp,
    group: 'Loans & savings',
    component: SipCalculator,
    size: { w: 480, h: 560 },
  },
  fd: {
    name: 'Fixed Deposit',
    does: 'Maturity value of FD with quarterly/monthly compounding.',
    icon: PiggyBank,
    group: 'Loans & savings',
    component: FdCalculator,
    size: { w: 480, h: 460 },
  },
  rd: {
    name: 'Recurring Deposit',
    does: 'What a monthly recurring deposit yields upon maturity.',
    icon: Repeat,
    group: 'Loans & savings',
    component: RdCalculator,
    size: { w: 480, h: 420 },
  },
  inflation: {
    name: 'Future Cost',
    does: 'Future cost and purchasing power erosion with inflation.',
    icon: Coins,
    group: 'Loans & savings',
    component: InflationCalculator,
    size: { w: 480, h: 420 },
  },
  tax: {
    name: 'Income Tax',
    does: 'FY 2026-27 Old vs New regime tax comparison with 80C/80D.',
    icon: ReceiptIndianRupee,
    group: 'Tax',
    component: TaxCalculator,
    size: { w: 580, h: 660 },
  },
  gst: {
    name: 'GST Calculator',
    does: 'Add or extract GST; 0/5/18/40%, CGST/SGST vs IGST.',
    icon: Receipt,
    group: 'Tax',
    component: GstCalculator,
    size: { w: 480, h: 480 },
  },
  currency: {
    name: 'Currency Converter',
    does: 'Forex conversion between Rupees, USD, EUR, AED, GBP, and custom rates.',
    icon: Banknote,
    group: 'Everyday',
    component: CurrencyConverter,
    size: { w: 480, h: 520 },
  },
  split: {
    name: 'Split a Bill',
    does: 'Each person’s share at table, with tip & rounded calculations.',
    icon: Users,
    group: 'Everyday',
    component: BillSplitter,
    size: { w: 420, h: 440 },
  },
  words: {
    name: 'Amount in Words',
    does: 'Cheque & voucher legal amount in Indian numbering words.',
    icon: FileText,
    group: 'Everyday',
    component: AmountInWords,
    size: { w: 440, h: 360 },
  },
} as const satisfies Record<string, ToolDef>;

export type ToolId = keyof typeof TOOLS;
export const TOOL_IDS = Object.keys(TOOLS) as ToolId[];
export const GROUPS: ToolGroup[] = ['Calculate', 'Loans & savings', 'Tax', 'Everyday'];
