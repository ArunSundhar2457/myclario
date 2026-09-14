export const sampleSnapshot = {
  month: "July 2026",
  balance: "₹45,200",
  income: "₹82,000",
  spent: "₹36,800",
  tasks: "12 / 15",
} as const;

export const sampleBudgets = [
  { label: "Groceries", value: "₹6,200", percent: 62 },
  { label: "Transport", value: "₹2,040", percent: 34 },
  { label: "Dining", value: "₹3,900", percent: 78 },
] as const;

export const sampleTransactions = [
  { label: "Groceries", detail: "Today", value: "−₹1,240" },
  { label: "Salary", detail: "12 Jul", value: "+₹82,000" },
  { label: "Metro", detail: "11 Jul", value: "−₹180" },
] as const;

export const spendingTrend = [
  { x: 0, y: 82, label: "1 Jul" },
  { x: 14, y: 70, label: undefined },
  { x: 28, y: 76, label: undefined },
  { x: 42, y: 47, label: "8 Jul" },
  { x: 58, y: 55, label: undefined },
  { x: 72, y: 31, label: undefined },
  { x: 86, y: 38, label: undefined },
  { x: 100, y: 18, label: "15 Jul" },
] as const;

export const trustItems = [
  "Free to use",
  "Made in India 🇮🇳",
  "AI-powered",
  "PWA installable",
  "GDPR compliant",
  "Secure",
] as const;

export const audiences = [
  "WORKING PROFESSIONALS",
  "FREELANCERS",
  "STUDENTS",
  "ENTREPRENEURS",
  "STARTUP FOUNDERS",
  "REMOTE WORKERS",
  "SMALL BUSINESS",
  "CONTENT CREATORS",
  "BUDGET PLANNERS",
  "GOAL SETTERS",
] as const;
