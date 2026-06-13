import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Clario" },
      { name: "description", content: "Sign in or create your Clario account." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <main className="relative flex min-h-screen w-full bg-background">
      {/* LEFT PANEL */}
      <section className="relative flex min-h-screen w-full flex-col md:w-1/2">
        <header className="absolute left-8 top-8 z-10">
          <img src="/clario-logo.svg" alt="Clario" style={{ width: 220 }} className="h-auto" />
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-24 md:px-12 lg:px-20">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {mode === "signup"
                ? "Create your account"
                : mode === "forgot"
                  ? "Reset your password"
                  : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your money. Your day. Sorted.
            </p>

            <div className="mt-8 flex flex-col gap-5">
              {mode !== "forgot" && (
                <>
                  <GoogleButton />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>
                </>
              )}

              {mode === "signin" && (
                <SignInForm
                  onForgot={() => setMode("forgot")}
                  onSwitch={() => setMode("signup")}
                />
              )}
              {mode === "signup" && <SignUpForm onSwitch={() => setMode("signin")} />}
              {mode === "forgot" && <ForgotForm onBack={() => setMode("signin")} />}

              {mode !== "forgot" && (
                <p className="text-center text-xs text-muted-foreground">
                  By continuing, you agree to Clario's{" "}
                  <a
                    href="/terms"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                  >
                    Terms
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <aside
        className="relative hidden w-1/2 overflow-hidden md:block"
        style={{
          background:
            "linear-gradient(135deg, #0b1024 0%, #131a3a 45%, #0e3d3a 100%)",
        }}
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

        {/* Floating preview stat cards */}
        <div className="absolute inset-x-0 top-0 h-1/2 p-12 lg:p-16">
          <div className="relative h-full w-full">
            <StatCard
              value="₹45,200"
              label="Saved this month"
              className="absolute left-0 top-4 w-56"
            />
            <StatCard
              value="12 tasks"
              label="Completed today"
              className="absolute right-2 top-24 w-52"
            />
            <StatCard
              value="₹8,400"
              label="Under budget"
              className="absolute left-12 top-56 w-52"
            />
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-12 lg:p-16">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
            Take control of your finances
          </h2>
          <p className="mt-4 max-w-md text-base text-white/70 lg:text-lg">
            Track expenses, plan your day, and hit your goals.
          </p>
        </div>
      </aside>
    </main>
  );
}

function StatCard({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-white shadow-lg backdrop-blur-xl " +
        (className ?? "")
      }
    >
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-white/70">{label}</div>
    </div>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://myclario.lovable.app/dashboard" },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
    }
  }
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-4 w-4" />
      )}
      Continue with Google
    </Button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}

function SignInForm({
  onForgot,
  onSwitch,
}: {
  onForgot: () => void;
  onSwitch: () => void;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="si-email">Email</Label>
        <Input
          id="si-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="si-password">Password</Label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="si-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </button>
      </p>
    </form>
  );
}

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your inbox to confirm your email.");
    onSwitch();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <Input
          id="su-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-password">Password</Label>
        <Input
          id="su-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">At least 6 characters.</p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("If that email exists, a reset link is on its way.");
    onBack();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Enter your email and we'll send you a reset link.
      </p>
      <div className="space-y-2">
        <Label htmlFor="fp-email">Email</Label>
        <Input
          id="fp-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send link
        </Button>
      </div>
    </form>
  );
}
