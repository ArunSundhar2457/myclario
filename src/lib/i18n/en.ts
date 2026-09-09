/** English is the source of truth: every key used in the app must exist here. */
export const en: Record<string, string> = {
  // Navigation / shell
  "nav.dashboard": "Home",
  "nav.transactions": "Transactions",
  "nav.budgets": "Budgets",
  "nav.planner": "Planner",
  "nav.insights": "Insights",
  "nav.settings": "Settings",
  "nav.signOut": "Sign out",
  "nav.signedOut": "Signed out",
  "brand.tagline": "Your money. Your day. Sorted.",

  // Settings
  "settings.title": "Settings",
  "settings.description": "Manage your profile, currency, language, and account data.",
  "settings.displayName": "Display name",
  "settings.displayNamePlaceholder": "Your name",
  "settings.currency": "Currency",
  "settings.language": "Language",
  "settings.export": "Export my data",
  "settings.exported": "Data exported",
  "settings.delete": "Delete Account",
  "settings.deleting": "Deleting…",
  "settings.deleted": "Account deleted",
  "settings.confirmTitle": "Are you sure?",
  "settings.confirmDescription":
    "This will permanently delete your account and all data. This cannot be undone.",
  "settings.needHelp": "Need help?",
  "settings.saved": "Saved",
  "settings.languageToast": "Language updated — refresh to see Clario in {language}.",
  "settings.refresh": "Refresh",
  "settings.versionLine": "Clario v{version} · Updated {date}",

  // Dashboard
  "dashboard.greeting": "Good to see you.",
  "dashboard.greetingNamed": "Good to see you, {name}.",
  "dashboard.income": "Income",
  "dashboard.spent": "Spent",
  "dashboard.balance": "Balance",
  "dashboard.todaysTasks": "Today's tasks",
  "dashboard.viewAll": "View all",
  "dashboard.noTasks": "No tasks due today 🎉",
  "dashboard.spendingTrend": "Spending trend",
  "dashboard.byCategory": "By category",
  "dashboard.noDataYet": "No data yet",
  "dashboard.noCategoryData": "Add transactions to see your category mix.",

  // Transactions
  "transactions.title": "Transactions",
  "transactions.subtitle": "Log income and expenses to keep an honest picture of your money.",
  "transactions.emptyIncome": "No income yet",
  "transactions.emptyExpenses": "No expenses yet",
  "transactions.emptyHint": "Add your first entry to start building a picture of your money.",
  "transactions.addIncome": "Add income",
  "transactions.addExpense": "Add expense",
  "transactions.exportCsv": "Export CSV",
  "transactions.previous": "Previous",
  "transactions.next": "Next",

  // Budgets
  "budgets.title": "Budgets",
  "budgets.empty": "No budgets yet",
  "budgets.edit": "Edit",
  "budgets.delete": "Delete",

  // Planner
  "planner.title": "Planner",
  "planner.empty": "Nothing planned yet",
  "planner.emptyHint": "Add your first task for {date} and set the tone for the day.",
  "planner.addTask": "Add task",

  // Insights
  "insights.title": "AI Insights",
  "insights.subtitle": "Let Clario read your month and tell you what matters most.",
  "insights.quickTip": "Quick tip",
  "insights.refresh": "Refresh",
  "insights.generateTitle": "Generate your insights",
  "insights.generateHint":
    "Clario will analyze the selected month's income, spending, and budgets, then hand back a calm read of where you stand.",
  "insights.generate": "Generate insights",

  // Common
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.saving": "Saving…",

  // Lhana
  "nav.lhana": "Ask Lhana",
  "lhana.title": "Ask Lhana",
  "lhana.greeting": "Hey, I'm Lhana ✨",
  "lhana.intro":
    "Your calm, no-judgment money guide. Ask me anything about your month and I'll explain what it means — and what to do next.",
  "lhana.readonlyNote": "Lhana can explain and recommend — she never changes your records.",
  "lhana.placeholder": "Ask about your money…",
  "lhana.send": "Send",
  "lhana.cancel": "Stop",
  "lhana.thinking": "Lhana is thinking…",
  "lhana.error": "Lhana couldn't answer right now — try again in a moment.",
  "lhana.promptSpending": "Where did my money go this month?",
  "lhana.promptAfford": "Can I afford a ₹5,000 purchase?",
  "lhana.promptMonth": "How is my budget looking?",
  "lhana.promptChange": "What's one thing I could improve?",
  "lhana.why": "Why? Ask Lhana",
  "lhana.askAbout": "Ask Lhana about this",
  "lhana.stopped": "Stopped — Lhana's answer was cancelled.",
  "lhana.degraded": "Showing your figures without Lhana's commentary right now.",
  "lhana.fallbackNoData":
    "I can't see any income, expenses, or budgets for this month yet. Add a few entries and I'll start spotting patterns for you.",
  "lhana.fallbackSummary":
    "In {month} you brought in {income} and spent {spent}, which leaves {net}. Ask me about a category or your budgets for more detail.",
  "lhana.card.income": "Income",
  "lhana.card.spent": "Spent",
  "lhana.card.netLeft": "Left this month",
  "lhana.card.vsPrevious": "Spending vs last month",
  "lhana.card.thisMonth": "This month",
  "lhana.card.previousMonth": "Last month",
  "lhana.card.recentActivity": "Recent activity",
  "lhana.card.purchase": "Purchase",
  "lhana.card.leftAfter": "Left after this:",
  "lhana.card.used": "used",

  // Theme
  "theme.label": "Appearance",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
};

export default en;
