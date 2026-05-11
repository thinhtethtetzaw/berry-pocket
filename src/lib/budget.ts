// ─────────────────────────────────────────────────────────────────────────
// Berry's Monthly Budget Plan
// ─────────────────────────────────────────────────────────────────────────

export const DEFAULT_BUDGET = {
  income: 80_000,
  savings: 50_000,
  necessary: 3_000,
  living: 11_750,
};

export interface FixedItem {
  id: string;
  label: string;
  icon: string; // lucide icon name (kept simple: emoji label)
  amount: number;
}

export const DEFAULT_FIXED: FixedItem[] = [
  { id: 'rent',    label: 'Rent',          icon: 'Home',         amount: 6_250 },
  { id: 'ai',      label: 'AI Subs',       icon: 'Sparkles',     amount: 2_000 },
  { id: 'util',    label: 'Utilities',     icon: 'Plug',         amount: 2_000 },
  { id: 'bro',     label: 'Brother',       icon: 'Heart',        amount: 1_000 },
  { id: 'family',  label: 'For my parents',icon: 'Heart',        amount: 2_000 },
  { id: 'rosca',   label: 'ROSCA',         icon: 'Users',        amount: 2_000 },
];

// ─────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────

export type MainCategoryId = 'income' | 'savings' | 'necessary' | 'fixed' | 'rosca' | 'living';

export interface MainCategory {
  id: MainCategoryId;
  label: string;
  icon: string;
  type: 'in' | 'out';
}

export const MAIN_CATEGORIES: MainCategory[] = [
  { id: 'income',    label: 'Income',         icon: 'LogIn',       type: 'in'  },
  { id: 'savings',   label: 'Savings',        icon: 'PiggyBank',   type: 'out' },
  { id: 'necessary', label: 'Necessary',      icon: 'ShieldCheck', type: 'out' },
  { id: 'fixed',     label: 'Fixed',          icon: 'Home',        type: 'out' },
  { id: 'rosca',     label: 'ROSCA',          icon: 'Users',       type: 'out' },
  { id: 'living',    label: 'Living',         icon: 'Coffee',      type: 'out' },
];

export interface SubCategory {
  id: string;
  label: string;
  icon: string;
  main: MainCategoryId;
}

export const SUB_CATEGORIES: SubCategory[] = [
  // Income
  { id: 'salary',        label: 'Salary',         icon: 'Briefcase',   main: 'income' },
  { id: 'bonus',         label: 'Bonus',          icon: 'Gift',        main: 'income' },
  { id: 'side',          label: 'Side',           icon: 'Sparkles',    main: 'income' },

  // Savings
  { id: 'savings',       label: 'Savings',        icon: 'PiggyBank',   main: 'savings' },
  { id: 'investment',    label: 'Investment',     icon: 'TrendingUp',  main: 'savings' },

  // Necessary fund
  { id: 'medical',       label: 'Medical',        icon: 'Heart',       main: 'necessary' },
  { id: 'emergency',     label: 'Emergency',      icon: 'AlertCircle', main: 'necessary' },

  // Fixed
  { id: 'rent',          label: 'Rent',           icon: 'Home',        main: 'fixed' },
  { id: 'ai',            label: 'AI Subs',        icon: 'Sparkles',    main: 'fixed' },
  { id: 'utilities',     label: 'Utilities',      icon: 'Plug',        main: 'fixed' },
  { id: 'brother',       label: 'Brother',        icon: 'Heart',       main: 'fixed' },

  // ROSCA
  { id: 'rosca-pay',     label: 'ROSCA Payment',  icon: 'Users',       main: 'rosca' },

  // Living
  { id: 'food',          label: 'Food',           icon: 'UtensilsCrossed', main: 'living' },
  { id: 'transport',     label: 'Transport',      icon: 'Car',         main: 'living' },
  { id: 'shopping',      label: 'Shopping',       icon: 'ShoppingBag', main: 'living' },
  { id: 'entertainment', label: 'Entertainment',  icon: 'Film',        main: 'living' },
  { id: 'personal',      label: 'Personal',       icon: 'Smile',       main: 'living' },
  { id: 'other',         label: 'Other',          icon: 'Package',     main: 'living' },
];

export interface Transaction {
  id: number;
  main: MainCategoryId;
  cat: string;
  desc: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

// ─────────────────────────────────────────────────────────────────────────
// ROSCA (dynamic config)
// ─────────────────────────────────────────────────────────────────────────

export interface RoscaConfig {
  groupSize: number;       // people per round (months)
  myPosition: number;      // my number (1..groupSize)
  monthlyPayment: number;  // baht / month
  startYear: number;
  startMonth: number;      // 0-indexed
  startDay: number;        // day of month
}

export const DEFAULT_ROSCA: RoscaConfig = {
  groupSize: 10,
  myPosition: 5,
  monthlyPayment: 2_000,
  startYear: 2026,
  startMonth: 4, // May
  startDay: 5,
};

export function deriveRoscaSchedule(cfg: RoscaConfig) {
  const months: { year: number; month: number; date: Date; isPayout: boolean }[] = [];
  for (let i = 0; i < cfg.groupSize; i++) {
    const m = cfg.startMonth + i;
    const year = cfg.startYear + Math.floor(m / 12);
    const month = m % 12;
    months.push({
      year,
      month,
      date: new Date(year, month, cfg.startDay),
      isPayout: i + 1 === cfg.myPosition,
    });
  }
  const payoutMonth = months.find(m => m.isPayout)!;
  return {
    months,
    payoutDate: payoutMonth.date,
    payoutAmount: cfg.monthlyPayment * cfg.groupSize,
    totalContribution: cfg.monthlyPayment * cfg.groupSize,
  };
}
