import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getProfile } from "@/lib/profile.functions";
import { DICTS, translate, type Language } from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const fallback = (key: string) => translate("en", key);

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  t: fallback,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const getProfileFn = useServerFn(getProfile);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
    staleTime: 5 * 60 * 1000,
  });

  const profileLanguage = (profile as { language?: string } | undefined)?.language;

  const value = useMemo<LanguageContextValue>(() => {
    const language = (profileLanguage ?? "en") as Language;
    const dict = DICTS[language] ?? DICTS.en;
    return {
      language,
      t: (key, vars) => {
        let s = dict[key] ?? translate("en", key);
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
        return s;
      },
    };
  }, [profileLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
