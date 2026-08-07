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
};

export default en;
