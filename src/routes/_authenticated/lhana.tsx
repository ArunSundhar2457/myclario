import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, X } from "lucide-react";
import { askLhana } from "@/lib/lhana.functions";
import type { LhanaCard } from "@/lib/lhana.logic";
import { useCurrency } from "@/components/currency-provider";
import { useLanguage } from "@/components/language-provider";
import { useAppStore } from "@/lib/app-store";
import {
  LhanaBudgetCard,
  LhanaComparisonCard,
  LhanaMessage,
  LhanaMetricCard,
  LhanaPromptChip,
  LhanaThinking,
  LhanaTransactionsCard,
  LhanaWelcome,
} from "@/components/lhana";
import { Button } from "@/components/ui/button";

type Msg = {
  role: "user" | "assistant";
  text: string;
  cards?: LhanaCard[];
  tone?: "normal" | "error" | "stopped" | "degraded";
};

const searchSchema = (search: Record<string, unknown>): { q?: string } => ({
  q: typeof search.q === "string" && search.q.trim() ? search.q.trim().slice(0, 500) : undefined,
});

export const Route = createFileRoute("/_authenticated/lhana")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Ask Lhana — Clario" },
      {
        name: "description",
        content:
          "Ask Lhana, Clario's AI money guide, about your spending, budgets, and month — in plain language.",
      },
      { property: "og:title", content: "Ask Lhana — Clario" },
      {
        property: "og:description",
        content: "Your calm AI guide to your money, inside Clario.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LhanaPage,
});

/** Deterministic, server-computed result cards. The model never supplies figures. */
function CardGrid({ cards }: { cards: LhanaCard[] }) {
  const { t } = useLanguage();
  if (cards.length === 0) return null;
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {cards.map((card, i) => {
        switch (card.type) {
          case "metric":
            return (
              <LhanaMetricCard
                key={i}
                label={card.label}
                value={card.value}
                {...(card.hint ? { hint: card.hint } : {})}
                tone={card.tone ?? "default"}
              />
            );
          case "comparison":
            return (
              <LhanaComparisonCard
                key={i}
                label={card.label}
                currentLabel={card.currentLabel}
                currentValue={card.currentValue}
                previousLabel={card.previousLabel}
                previousValue={card.previousValue}
                deltaText={card.deltaText}
                tone={card.tone}
              />
            );
          case "budget":
            return (
              <LhanaBudgetCard
                key={i}
                category={card.category}
                spent={card.spent}
                limit={card.limit}
                percentUsed={card.percentUsed}
                usedLabel={t("lhana.card.used")}
                tone={card.tone}
              />
            );
          case "transactions":
            return <LhanaTransactionsCard key={i} title={card.title} items={card.items} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function LhanaPage() {
  const { t, language } = useLanguage();
  const { currency, rate } = useCurrency();
  const { selectedMonth } = useAppStore();
  const { q } = Route.useSearch();
  const ask = useServerFn(askLhana);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prefilled = useRef(false);

  const prompts = [
    t("lhana.promptSpending"),
    t("lhana.promptAfford"),
    t("lhana.promptMonth"),
    t("lhana.promptChange"),
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [pending]);

  // Abort any in-flight request if the user leaves the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || pending) return;
    const next: Msg[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setPending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await ask({
        signal: controller.signal,
        data: {
          message: text,
          history: next.slice(-13, -1).map((m) => ({ role: m.role, text: m.text })),
          currency,
          rate,
          month: selectedMonth,
          language,
        },
      });
      if (res.ok) {
        setMessages([
          ...next,
          {
            role: "assistant",
            text: res.reply,
            cards: res.cards,
            tone: res.degraded ? "degraded" : "normal",
          },
        ]);
      } else {
        const key =
          res.error === "quota"
            ? "lhana.limitQuota"
            : res.error === "cooldown"
              ? "lhana.limitCooldown"
              : "lhana.error";
        setMessages([...next, { role: "assistant", text: t(key), tone: "error" }]);
      }
    } catch (err) {
      // A real abort: the request was cancelled end-to-end, so say exactly that.
      const aborted = controller.signal.aborted || (err as Error)?.name === "AbortError";
      setMessages([
        ...next,
        {
          role: "assistant",
          text: aborted ? t("lhana.stopped") : t("lhana.error"),
          tone: aborted ? "stopped" : "error",
        },
      ]);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setPending(false);
    }
  }

  /** Real cancellation: aborts the HTTP request, which aborts the Gemini call server-side. */
  function cancel() {
    abortRef.current?.abort();
  }

  // Prefill from "Why? Ask Lhana" links — send once, never persist.
  useEffect(() => {
    if (q && !prefilled.current) {
      prefilled.current = true;
      void send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mx-auto flex h-[calc(100dvh-11rem)] max-w-3xl flex-col md:h-[calc(100dvh-7rem)]">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t("lhana.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("lhana.readonlyNote")}</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-border bg-secondary/40 p-4 md:p-6"
        aria-live="polite"
      >
        {messages.length === 0 && !pending ? (
          <LhanaWelcome title={t("lhana.greeting")} body={t("lhana.intro")}>
            <div className="mt-2 flex max-w-md flex-wrap justify-center gap-2">
              {prompts.map((p) => (
                <LhanaPromptChip key={p} label={p} onClick={() => void send(p)} />
              ))}
            </div>
          </LhanaWelcome>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i}>
                <LhanaMessage role={m.role}>
                  <span
                    className={
                      m.tone === "error"
                        ? "whitespace-pre-wrap text-destructive"
                        : m.tone === "stopped"
                          ? "whitespace-pre-wrap text-muted-foreground"
                          : "whitespace-pre-wrap"
                    }
                  >
                    {m.text}
                  </span>
                  {m.tone === "degraded" && (
                    <span className="mt-2 block text-xs text-muted-foreground">
                      {t("lhana.degraded")}
                    </span>
                  )}
                </LhanaMessage>
                {m.role === "assistant" && m.cards && m.cards.length > 0 && (
                  <div className="pl-[46px]">
                    <CardGrid cards={m.cards} />
                  </div>
                )}
              </div>
            ))}
            {pending && <LhanaThinking label={t("lhana.thinking")} />}
          </>
        )}
      </div>

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder={t("lhana.placeholder")}
          aria-label={t("lhana.placeholder")}
          rows={1}
          maxLength={500}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm shadow-card outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        {pending ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={cancel}
            aria-label={t("lhana.cancel")}
            className="h-11 w-11 rounded-2xl"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            aria-label={t("lhana.send")}
            className="h-11 w-11 rounded-2xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
