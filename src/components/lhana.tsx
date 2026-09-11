import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import lhanaAvatar from "@/assets/lhana-avatar.png";
import lhanaWelcome from "@/assets/lhana-welcome.png";
import lhanaThinking from "@/assets/lhana-thinking.png";
import lhanaInsight from "@/assets/lhana-insight.png";
import lhanaCelebrate from "@/assets/lhana-celebrate.png";

/**
 * Canonical Lhana component system. One consistent character identity
 * everywhere: same face, hair, navy hoodie, violet "C". Only pose changes.
 */
export const LHANA_POSES = {
  avatar: lhanaAvatar,
  welcome: lhanaWelcome,
  thinking: lhanaThinking,
  insight: lhanaInsight,
  celebrate: lhanaCelebrate,
} as const;

export type LhanaPose = keyof typeof LHANA_POSES;

export function LhanaAvatar({
  size = 40,
  pose = "avatar",
  className,
}: {
  size?: number;
  pose?: LhanaPose;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-lhana-soft ring-2 ring-lhana/25",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={LHANA_POSES[pose]}
        alt="Lhana, your Clario money guide"
        loading="lazy"
        width={768}
        height={768}
        className="h-full w-full object-cover"
        style={{ objectPosition: "center 20%" }}
      />
    </span>
  );
}

export function LhanaLauncher({ label }: { label: string }) {
  return (
    <Link
      to="/lhana"
      aria-label={label}
      className="group fixed bottom-24 right-4 z-30 flex items-center gap-2 md:bottom-8 md:right-8"
    >
      <span className="pointer-events-none translate-x-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-elevated transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 max-md:hidden">
        {label}
      </span>
      <span className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 border-lhana/40 bg-lhana-soft shadow-lhana transition-transform duration-200 group-hover:scale-105 group-active:scale-95 motion-safe:animate-card-float motion-reduce:animate-none">
        <img
          src={LHANA_POSES.avatar}
          alt=""
          loading="lazy"
          width={768}
          height={768}
          className="h-full w-full object-cover"
          style={{ objectPosition: "center 20%" }}
        />
      </span>
    </Link>
  );
}

export function LhanaWelcome({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
      <img
        src={LHANA_POSES.welcome}
        alt="Lhana waving hello"
        loading="lazy"
        width={768}
        height={768}
        className="h-36 w-36 rounded-3xl object-cover shadow-lhana"
        style={{ objectPosition: "center 15%" }}
      />
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {children}
    </div>
  );
}

export function LhanaPromptChip({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-lhana/30 bg-lhana-soft px-4 py-2 text-xs font-medium text-foreground shadow-card transition-all hover:-translate-y-0.5 hover:border-lhana/60 hover:shadow-elevated disabled:opacity-50 motion-reduce:transition-none"
    >
      {label}
    </button>
  );
}

export function LhanaMessage({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[85%] rounded-3xl rounded-br-md bg-chat-user px-4 py-3 text-sm leading-relaxed text-chat-user-foreground shadow-card sm:max-w-[70%]">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 animate-fade-up">
      <LhanaAvatar size={34} />
      <div className="max-w-[85%] rounded-3xl rounded-tl-md border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-card sm:max-w-[75%]">
        {children}
      </div>
    </div>
  );
}

export function LhanaThinking({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 animate-fade-up">
      <LhanaAvatar size={34} pose="thinking" />
      <div
        className="flex items-center gap-1.5 rounded-3xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-card"
        role="status"
        aria-label={label}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-lhana animate-thinking-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

export function LhanaMetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn";
}) {
  const tones = {
    default: "text-foreground",
    good: "text-success",
    warn: "text-destructive",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1.5 font-display text-xl font-bold tabular-nums", tones[tone])}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function LhanaInsightCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-lhana/25 bg-gradient-to-br from-lhana-soft to-card p-5 shadow-card">
      <div className="flex items-center gap-2.5">
        <LhanaAvatar size={30} />
        <span className="text-xs font-semibold uppercase tracking-wide text-lhana">{title}</span>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-foreground">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  );
}

export function LhanaComparisonCard({
  label,
  currentLabel,
  currentValue,
  previousLabel,
  previousValue,
  deltaText,
  tone = "default",
}: {
  label: string;
  currentLabel: string;
  currentValue: string;
  previousLabel: string;
  previousValue: string;
  deltaText: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass = {
    default: "text-muted-foreground",
    good: "text-success",
    warn: "text-destructive",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground">{currentLabel}</p>
          <p className="font-display text-xl font-bold tabular-nums">{currentValue}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">{previousLabel}</p>
          <p className="font-display text-base font-semibold tabular-nums text-muted-foreground">
            {previousValue}
          </p>
        </div>
      </div>
      <p className={cn("mt-2 text-xs font-semibold tabular-nums", toneClass[tone])}>{deltaText}</p>
    </div>
  );
}

export function LhanaBudgetCard({
  category,
  spent,
  limit,
  percentUsed,
  usedLabel,
  tone = "default",
}: {
  category: string;
  spent: string;
  limit: string;
  percentUsed: number;
  usedLabel: string;
  tone?: "default" | "good" | "warn";
}) {
  const bar = {
    default: "bg-lhana",
    good: "bg-success",
    warn: "bg-destructive",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{category}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {percentUsed}% {usedLabel}
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={Math.min(percentUsed, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={category}
      >
        <span
          className={cn("block h-full rounded-full", bar[tone])}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs tabular-nums text-muted-foreground">
        {spent} / {limit}
      </p>
    </div>
  );
}

export function LhanaTransactionsCard({
  title,
  items,
}: {
  title: string;
  items: { date: string; label: string; amount: string }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:col-span-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 divide-y divide-border">
        {items.map((it, i) => (
          <li key={`${it.date}-${i}`} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm">{it.label}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{it.date}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{it.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LhanaEmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-lhana/30 bg-lhana-soft/50 px-6 py-10 text-center">
      <img
        src={LHANA_POSES.thinking}
        alt="Lhana thinking"
        loading="lazy"
        width={768}
        height={768}
        className="h-24 w-24 rounded-2xl object-cover"
        style={{ objectPosition: "center 15%" }}
      />
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}
