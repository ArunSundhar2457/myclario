import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const KEY = "clario-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(KEY)) setVisible(true);
  }, []);

  function choose(v: "accepted" | "declined") {
    try {
      window.localStorage.setItem(KEY, v);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies to improve your experience. Read our{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => choose("declined")}>
            Decline
          </Button>
          <Button size="sm" onClick={() => choose("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
