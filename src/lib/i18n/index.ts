import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";

export type Language = "en" | "de" | "es" | "fr";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

export const DEFAULT_LANGUAGE: Language = "en";

export const DICTS: Record<Language, Record<string, string>> = { en, de, es, fr };

export function translate(lang: Language, key: string, vars?: Record<string, string | number>): string {
  let s = DICTS[lang]?.[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
