import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Clario" },
      { name: "description", content: "The terms that apply when you use Clario." },
      { property: "og:title", content: "Terms of Service — Clario" },
      { property: "og:description", content: "Terms of use for Clario." },
    ],
  }),
  component: TermsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2, 2026</p>
        </header>

        <Section title="1. Acceptance of Terms">
          <p>By using Clario, you agree to these terms. If you do not agree, please do not use the app.</p>
        </Section>

        <Section title="2. What Clario Is">
          <p>
            Clario is a personal finance tracking and daily planning tool. It is provided for personal use only.
            It is not a financial advisor. Any AI insights are informational only — not financial advice.
          </p>
        </Section>

        <Section title="3. Your Account">
          <ul className="list-disc space-y-1 pl-5">
            <li>You are responsible for keeping your account secure</li>
            <li>You must provide accurate information</li>
            <li>You must be 13 or older to use Clario</li>
            <li>One account per person</li>
          </ul>
        </Section>

        <Section title="4. Your Data">
          <ul className="list-disc space-y-1 pl-5">
            <li>You own your data</li>
            <li>We do not sell it, share it, or use it for advertising</li>
            <li>You can export or delete it anytime</li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use Clario for illegal purposes</li>
            <li>Attempt to access other users' data</li>
            <li>Reverse engineer or copy the application</li>
            <li>Use automated scripts to access the service</li>
          </ul>
        </Section>

        <Section title="6. AI Insights Disclaimer">
          <p>
            AI-generated insights are for informational purposes only. Clario is not a licensed financial
            advisor. Always consult a professional for financial decisions.
          </p>
        </Section>

        <Section title="7. Service Availability">
          <ul className="list-disc space-y-1 pl-5">
            <li>We aim for high availability but do not guarantee 100% uptime</li>
            <li>We may update or change features over time</li>
            <li>We will notify users of major changes</li>
          </ul>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            Clario is provided "as is" without warranties. We are not liable for any financial decisions
            made based on app data or AI insights.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            We reserve the right to suspend accounts that violate these terms. You can delete your account
            anytime from Settings.
          </p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>
            We may update these terms. Continued use of Clario after changes means you accept the new terms.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            For questions about these terms:{" "}
            <a href="mailto:myclario.help@gmail.com" className="text-primary">
              myclario.help@gmail.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}
