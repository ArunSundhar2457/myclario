import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reset password — Clario" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When the user lands here from the reset email, Supabase fires a
    // PASSWORD_RECOVERY event after parsing the recovery hash.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also allow direct use if a session already exists.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card">
        <h1 className="font-display text-xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Pick a fresh password — at least 6 characters."
            : "Open this page from your reset email to continue."}
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="np">New password</Label>
            <Input
              id="np"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              disabled={!ready}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={!ready || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </main>
  );
}
