import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "INR" | "USD" | "EUR" | "GBP";

type AppState = {
  // ISO yyyy-mm of currently selected month (filters all data globally)
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMonth: currentMonth(),
      setSelectedMonth: (m) => set({ selectedMonth: m }),
      currency: "INR",
      setCurrency: (c) => set({ currency: c }),
    }),
    { name: "clario-app" },
  ),
);

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function formatMoney(amount: number, currency: Currency): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOL[currency]}${amount.toFixed(0)}`;
  }
}
