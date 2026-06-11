import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clario — Your money. Your day. Sorted." },
      {
        name: "description",
        content:
          "Clario is a calm, AI-powered personal finance and daily planning app. Track income, expenses, budgets, and tasks in one place.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-8 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
          <span className="font-display text-3xl font-bold">C</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Clario
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Your money. Your day. Sorted.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          Setting things up. Once Supabase is connected, sign in to get started.
        </p>
      </div>
    </main>
  );
}
