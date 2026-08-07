import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getProfile } from "@/lib/profile.functions";
import { dictionaries, type Language } from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  t: (key: string) => string;
};

const fallback = (key: string) => dictionaries.en[key] ?? key;

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

  const value = useMemo<LanguageContextValue>(() => {
    const language = ((profile as { language?: string } | undefined)?.language ??
      "en") as Language;
    const dict = dictionaries[language] ?? dictionaries.en;
    return {
      language,
      t: (key: string) => dict[key] ?? fallback(key),
    };
  }, [(profile as { language?: string } | undefined)?.language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
