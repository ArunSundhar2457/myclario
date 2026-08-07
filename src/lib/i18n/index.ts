import { en } from "./en";
import { de } from "./de";
import { es } from "./es";

export type Language = "en" | "de" | "es";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
];

export const dictionaries: Record<Language, Record<string, string>> = { en, de, es };

export { en, de, es };
