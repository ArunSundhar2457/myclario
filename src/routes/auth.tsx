import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Circle, Eye, EyeOff, Loader2 } from "lucide-react";

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
        <header className="absolute left-8 top-8 z-10 flex items-center gap-3">
          <ClarioMark className="h-10 w-10" />
          <div>
            <p className="font-display text-2xl font-semibold leading-none tracking-tight text-foreground">
              Clario
            </p>
            <p className="mt-1 text-[11px] tracking-wide text-muted-foreground">
              Your money. Your day. Sorted.
            </p>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-16 md:px-12 md:py-12 lg:px-20">
          <div className="w-full max-w-sm animate-fade-up">
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {mode === "signup"
                ? "Create your account"
                : mode === "forgot"
                  ? "Reset your password"
                  : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Your money. Your day. Sorted.</p>

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
                <SignInForm onForgot={() => setMode("forgot")} onSwitch={() => setMode("signup")} />
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
      <aside className="relative hidden w-1/2 overflow-hidden md:block">
        {/* Animated gradient base — deep navy lit by Clario violet */}
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--navy) 0%, color-mix(in oklch, var(--navy) 82%, var(--primary)) 42%, color-mix(in oklch, var(--navy) 90%, var(--primary)) 70%, var(--navy) 100%)",
          }}
        />
        {/* Floating ambient violet glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 animate-float-slow rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 animate-float-slower rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 animate-float-slow rounded-full bg-white/5 blur-3xl" />

        {/* Floating preview stat cards */}
        <div className="absolute inset-x-0 top-0 h-1/2 p-12 lg:p-16">
          <div className="relative h-full w-full">
            <StatCard
              value="₹45,200"
              label="Saved this month"
              className="absolute left-0 top-4 w-56 animate-card-float"
            />
            <StatCard
              value="12 tasks"
              label="Completed today"
              className="absolute right-2 top-24 w-52 animate-card-float [animation-delay:1.5s]"
            />
            <StatCard
              value="₹8,400"
              label="Under budget"
              className="absolute left-12 top-56 w-52 animate-card-float [animation-delay:3s]"
            />
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-12 lg:p-16">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-navy-foreground lg:text-5xl">
            Take control of your finances
          </h2>
          <p className="mt-4 max-w-md text-base text-navy-foreground/70 lg:text-lg">
            Track expenses, plan your day, and hit your goals.
          </p>
        </div>
      </aside>
    </main>
  );
}

function ClarioMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <path
        d="M 40 6 A 26 26 0 1 0 40 58"
        transform="translate(6, 4)"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <polyline
        points="18,48 28,34 38,41 50,20"
        transform="translate(6, 4)"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="56" cy="24" r="4.5" fill="var(--color-primary)" />
    </svg>
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
        "rounded-xl border border-white/15 bg-navy/40 px-5 py-4 shadow-lhana backdrop-blur-md ring-1 ring-white/5 " +
        (className ?? "")
      }
    >
      <div className="text-2xl font-semibold tracking-tight text-navy-foreground">{value}</div>
      <div className="mt-1 text-xs text-navy-foreground/60">{label}</div>
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
    <Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={loading}>
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
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function SignInForm({ onForgot, onSwitch }: { onForgot: () => void; onSwitch: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Please enter your email.");
      return;
    }
    if (!password) {
      setPasswordError("Please enter your password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Incorrect email or password.");
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="si-email">Email</Label>
        <Input
          id="si-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
        />
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
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
        <div className="relative">
          <Input
            id="si-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-10"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError("");
            }}
          />
          <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        </div>
        {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const rules = [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "At least 1 number", met: /[0-9]/.test(password) },
    { label: "At least 1 letter", met: /[a-zA-Z]/.test(password) },
    {
      label: "At least 1 special character (e.g. !@#$%^&*)",
      met: /[^a-zA-Z0-9]/.test(password),
    },
  ];
  const allMet = rules.every((r) => r.met);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allMet) return;
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
        <div className="relative">
          <Input
            id="su-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        </div>
        <ul className="mt-1 space-y-1">
          {rules.map((r) => (
            <li
              key={r.label}
              className={
                "flex items-center gap-2 text-xs " +
                (r.met ? "text-primary" : "text-muted-foreground")
              }
            >
              {r.met ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0" />
              )}
              {r.label}
            </li>
          ))}
        </ul>
      </div>
      <Button type="submit" className="w-full" disabled={loading || !allMet}>
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
    if (error) return toast.error("Couldn't send reset link. Please try again.");
    toast.success("Password reset link sent. Check your email.");
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
