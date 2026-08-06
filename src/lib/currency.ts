export type Currency = "INR" | "USD" | "EUR" | "GBP";

export const CURRENCIES: Currency[] = ["INR", "USD", "EUR", "GBP"];

export const CURRENCY_LOCALE: Record<Currency, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export type Rates = Partial<Record<string, number>> | null | undefined;

/** Rate used to convert an INR amount into `target`. Falls back to INR (1). */
export function rateFor(target: Currency, rates: Rates): { currency: Currency; rate: number } {
  if (target === "INR") return { currency: "INR", rate: 1 };
  const r = rates?.[target];
  if (typeof r !== "number" || !Number.isFinite(r) || r <= 0) {
    return { currency: "INR", rate: 1 };
  }
  return { currency: target, rate: r };
}

function format(value: number, currency: Currency): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${CURRENCY_SYMBOL[currency]}${Math.round(value)}`;
  }
}

/**
 * Converts an INR amount into the target currency using cached daily rates and
 * formats it. Missing rates fall back to displaying INR rather than NaN.
 */
export function convertAndFormat(
  amountInINR: number,
  targetCurrency: Currency,
  rates: Rates,
): string {
  const amount = Number.isFinite(amountInINR) ? amountInINR : 0;
  const { currency, rate } = rateFor(targetCurrency, rates);
  return format(amount * rate, currency);
}
