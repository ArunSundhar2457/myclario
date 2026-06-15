import {
  Utensils,
  Car,
  Film,
  Zap,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Package,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Health",
  "Shopping",
  "Education",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  Food: Utensils,
  Transport: Car,
  Entertainment: Film,
  Utilities: Zap,
  Health: HeartPulse,
  Shopping: ShoppingBag,
  Education: GraduationCap,
  Other: Package,
  Salary: Wallet,
  Freelance: Laptop,
  Business: Building2,
  Investment: TrendingUp,
};

export function categoryIcon(name: string): LucideIcon {
  return CATEGORY_ICON[name] ?? Package;
}
