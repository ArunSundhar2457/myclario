import { create } from "zustand";
import { persist } from "zustand/middleware";

export type { Currency } from "./currency";
export { CURRENCY_SYMBOL, convertAndFormat } from "./currency";

type AppState = {
  // ISO yyyy-mm of currently selected month (filters all data globally)
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
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
    }),
    { name: "clario-app" },
  ),
);
