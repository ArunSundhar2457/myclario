import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LandingPageContent } from "@/components/landing/landing-page";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Clario — Your money. Your day. Sorted." },
      {
        name: "description",
        content: "The AI-powered app that connects your finances and daily planning in one place.",
      },
      { property: "og:title", content: "Clario — Your money. Your day. Sorted." },
      {
        property: "og:description",
        content: "The AI-powered app that connects your finances and daily planning in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Clario — Your money. Your day. Sorted." },
      {
        name: "twitter:description",
        content: "The AI-powered app that connects your finances and daily planning in one place.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) navigate({ to: "/dashboard", replace: true });
      else setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (!ready) return null;
  return <LandingPageContent />;
}
