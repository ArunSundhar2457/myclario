import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Clario" },
      {
        name: "description",
        content: "How Clario collects, stores, and protects your personal and financial data.",
      },
      { property: "og:title", content: "Privacy Policy — Clario" },
      { property: "og:description", content: "How Clario handles your data." },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2, 2026</p>
        </header>

        <Section title="1. Who We Are">
          <p>
            Clario is a personal finance and daily planning app built to help you manage your money
            and time. We are operated by an independent developer.
          </p>
          <p>
            Contact:{" "}
            <a href="mailto:myclario.help@gmail.com" className="text-primary">
              myclario.help@gmail.com
            </a>
          </p>
        </Section>

        <Section title="2. What Data We Collect">
          <ul className="list-disc space-y-1 pl-5">
            <li>Name and email address (when you sign up)</li>
            <li>
              Financial data you enter: income, expenses, budgets (stored securely in your account)
            </li>
            <li>Daily tasks and planner entries</li>
            <li>Currency preference and display name</li>
            <li>Cookie consent preference (stored locally)</li>
          </ul>
        </Section>

        <Section title="3. Why We Collect It">
          <ul className="list-disc space-y-1 pl-5">
            <li>To provide and improve the Clario service</li>
            <li>To authenticate your account securely</li>
            <li>To generate AI insights from your own data</li>
            <li>We never sell your data to third parties</li>
          </ul>
        </Section>

        <Section title="4. How We Store It">
          <ul className="list-disc space-y-1 pl-5">
            <li>All data is stored in Supabase (PostgreSQL) hosted on AWS Mumbai (ap-south-1)</li>
            <li>
              Your data is protected by Row Level Security — only you can access your own data
            </li>
            <li>Passwords are never stored in plain text</li>
            <li>All connections are encrypted via HTTPS</li>
          </ul>
        </Section>

        <Section title="5. AI and Your Data">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              AI Insights uses your financial summary (totals and categories only) to generate
              advice
            </li>
            <li>Raw transaction details are never sent to AI</li>
            <li>AI processing is done via Google Gemini API</li>
          </ul>
        </Section>

        <Section title="6. Your Rights (GDPR)">
          <ul className="list-disc space-y-1 pl-5">
            <li>Right to access: export all your data anytime from Settings → Export my data</li>
            <li>
              Right to delete: permanently delete your account and all data from Settings → Delete
              Account
            </li>
            <li>Right to correct: update your profile anytime in Settings</li>
            <li>
              Right to object: contact us at{" "}
              <a href="mailto:myclario.help@gmail.com" className="text-primary">
                myclario.help@gmail.com
              </a>
            </li>
          </ul>
        </Section>

        <Section title="7. Cookies">
          <ul className="list-disc space-y-1 pl-5">
            <li>We use minimal cookies for authentication and session management</li>
            <li>We ask for your consent on first visit</li>
            <li>You can decline non-essential cookies</li>
          </ul>
        </Section>

        <Section title="8. Third Party Services">
          <ul className="list-disc space-y-1 pl-5">
            <li>Supabase (database and authentication)</li>
            <li>Google OAuth (optional sign in method)</li>
            <li>Google Gemini AI (insights generation)</li>
          </ul>
        </Section>

        <Section title="9. Contact Us">
          <p>
            For any privacy concerns or data requests:{" "}
            <a href="mailto:myclario.help@gmail.com" className="text-primary">
              myclario.help@gmail.com
            </a>
          </p>
          <p>We will respond within 30 days.</p>
        </Section>
      </div>
    </div>
  );
}
