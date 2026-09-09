import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, X } from "lucide-react";
import { askLhana } from "@/lib/lhana.functions";
import { useCurrency } from "@/components/currency-provider";
import { useLanguage } from "@/components/language-provider";
import { useAppStore } from "@/lib/app-store";
import { LhanaMessage, LhanaPromptChip, LhanaThinking, LhanaWelcome } from "@/components/lhana";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; text: string };

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

function LhanaPage() {
  const { t, language } = useLanguage();
  const { currency, rate } = useCurrency();
  const { selectedMonth } = useAppStore();
  const { q } = Route.useSearch();
  const ask = useServerFn(askLhana);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestId = useRef(0);
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

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || pending) return;
    setFailed(false);
    const next: Msg[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setPending(true);
    const id = ++requestId.current;
    try {
      const res = await ask({
        data: {
          message: text,
          history: next.slice(-13, -1).map((m) => ({ role: m.role, text: m.text })),
          currency,
          rate,
          month: selectedMonth,
          language,
        },
      });
      if (id !== requestId.current) return; // cancelled
      if (res.ok) {
        setMessages([...next, { role: "assistant", text: res.reply }]);
      } else {
        setFailed(true);
      }
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) setPending(false);
    }
  }

  function cancel() {
    requestId.current += 1;
    setPending(false);
    setFailed(true);
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
              <LhanaMessage key={i} role={m.role}>
                <span className="whitespace-pre-wrap">{m.text}</span>
              </LhanaMessage>
            ))}
            {pending && <LhanaThinking label={t("lhana.thinking")} />}
            {failed && !pending && (
              <LhanaMessage role="assistant">
                <span className="text-destructive">{t("lhana.error")}</span>
              </LhanaMessage>
            )}
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
