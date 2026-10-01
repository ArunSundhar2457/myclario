// Illustrative sample data used only on the public landing page.
// Every figure shown from this file must be labelled as sample data in the UI.

export const sampleSnapshot = {
  month: "July 2026",
  balance: "₹45,200",
  income: "₹82,000",
  spent: "₹36,800",
  tasks: "12 / 15",
} as const;

export const sampleTransactions = [
  { label: "Groceries", detail: "Today · Food", value: "−₹1,240", kind: "expense" },
  { label: "Salary", detail: "12 Jul · Income", value: "+₹82,000", kind: "income" },
  { label: "Metro card", detail: "11 Jul · Transport", value: "−₹180", kind: "expense" },
  { label: "Dinner out", detail: "10 Jul · Food", value: "−₹1,450", kind: "expense" },
  { label: "Electricity", detail: "8 Jul · Bills", value: "−₹2,310", kind: "expense" },
] as const;

export const sampleBudgets = [
  { label: "Groceries", spent: "₹6,200", limit: "₹10,000", percent: 62 },
  { label: "Dining", spent: "₹4,600", limit: "₹5,000", percent: 92 },
  { label: "Transport", spent: "₹2,040", limit: "₹6,000", percent: 34 },
  { label: "Shopping", spent: "₹3,150", limit: "₹8,000", percent: 39 },
] as const;

export const sampleTasks = [
  { title: "Review monthly budget", time: "9:00", priority: "high", done: true },
  { title: "Pay electricity bill", time: "12:30", priority: "high", done: false },
  { title: "Log travel expense", time: "17:00", priority: "medium", done: false },
  { title: "Plan tomorrow", time: "21:00", priority: "low", done: false },
] as const;

// Approximate display conversions of ₹45,200, for illustration only.
export const sampleCurrencies = [
  { code: "INR", value: "₹45,200" },
  { code: "USD", value: "$540" },
  { code: "EUR", value: "€500" },
  { code: "GBP", value: "£425" },
] as const;

export const sampleLanguages = ["English", "Deutsch", "Español", "Français"] as const;
