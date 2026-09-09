import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Wallet,
  PiggyBank,
  CalendarCheck,
  Sparkles,
  LogOut,
  Settings as SettingsIcon,
  MessageCircleHeart,
} from "lucide-react";

import { useState, type ReactNode } from "react";
import { useAppStore } from "@/lib/app-store";
import { CurrencyProvider } from "@/components/currency-provider";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { supabase } from "@/integrations/supabase/client";
import { SettingsModal } from "@/components/settings-modal";
import { LhanaAvatar, LhanaLauncher } from "@/components/lhana";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: Home, enabled: true },
  { to: "/transactions", labelKey: "nav.transactions", icon: Wallet, enabled: true },
  { to: "/budgets", labelKey: "nav.budgets", icon: PiggyBank, enabled: true },
  { to: "/planner", labelKey: "nav.planner", icon: CalendarCheck, enabled: true },
  { to: "/insights", labelKey: "nav.insights", icon: Sparkles, enabled: true },
] as const;

function monthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString(undefined, { month: "long", year: "numeric" });
    opts.push({ value, label });
  }
  return opts;
}

function GlobalControls() {
  const { selectedMonth, setSelectedMonth } = useAppStore();
  return (
    <div className="flex items-center gap-2">
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger className="h-9 w-[150px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {monthOptions().map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


function Brand() {
  const { t } = useLanguage();
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-2.5 px-3 py-2 self-start"
      aria-label="Clario home"
    >
      <img src="/clario-icon.svg" alt="" className="h-10 w-10 rounded-lg" />
      <div className="flex flex-col leading-none">
        <span
          className="font-display tracking-tight text-foreground"
          style={{ fontSize: "22px", fontWeight: 700 }}
        >
          Clario
        </span>
        <span
          className="mt-1 text-muted-foreground"
          style={{ fontSize: "10px" }}
        >
          {t("brand.tagline")}
        </span>
      </div>
    </Link>
  );
}


function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { t } = useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success(t("nav.signedOut"));
    navigate({ to: "/auth", replace: true });
  }


  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar px-3 py-5 md:flex">
      <div className="px-0">
        <Brand />
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          const content = (
            <span
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                !item.enabled && "cursor-not-allowed opacity-60",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
              {!item.enabled && (
                <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                  soon
                </span>
              )}
            </span>
          );
          return item.enabled ? (
            <Link key={item.to} to={item.to}>
              {content}
            </Link>
          ) : (
            <button
              key={item.to}
              type="button"
              onClick={() => toast.info(`${t(item.labelKey)} arrives in the next build.`)}
              className="text-left"
            >
              {content}
            </button>
          );
        })}
        <Link to="/lhana" className="mt-3 block">
          <span
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all hover:shadow-elevated",
              pathname === "/lhana"
                ? "border-lhana/60 bg-lhana-soft text-foreground"
                : "border-lhana/30 bg-gradient-to-r from-lhana-soft to-card text-foreground",
            )}
          >
            <LhanaAvatar size={28} />
            {t("nav.lhana")}
          </span>
        </Link>
      </nav>
      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <SettingsIcon className="h-4 w-4" /> {t("nav.settings")}
        </button>

        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> {t("nav.signOut")}
        </button>
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:hidden">
      <Brand />
      <GlobalControls />
    </header>
  );
}

function DesktopHeader() {
  return (
    <header className="sticky top-0 z-10 hidden items-center justify-end border-b border-border bg-background/85 px-8 py-4 backdrop-blur md:flex">
      <GlobalControls />
    </header>
  );
}

function BottomNav() {
  const { t } = useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-border bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to;
        const inner = (
          <span
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
              !item.enabled && "opacity-60",
            )}
          >
            <Icon className="h-5 w-5" />
            {t(item.labelKey)}
          </span>
        );
        return item.enabled ? (
          <Link key={item.to} to={item.to} className="flex flex-1">
            {inner}
          </Link>
        ) : (
          <button
            key={item.to}
            type="button"
            className="flex flex-1"
            onClick={() => toast.info(`${t(item.labelKey)} arrives in the next build.`)}
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}

function LhanaFab() {
  const { t } = useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/lhana") return null;
  return <LhanaLauncher label={t("nav.lhana")} />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <LanguageProvider>
    <CurrencyProvider>
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <DesktopHeader />
        <main className="flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-6">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
      <BottomNav />
      <LhanaFab />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
    </CurrencyProvider>
    </LanguageProvider>
  );
}

