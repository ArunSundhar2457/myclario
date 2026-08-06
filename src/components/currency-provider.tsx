import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getProfile } from "@/lib/profile.functions";
import { getLatestRates } from "@/lib/currency.functions";
import { convertAndFormat, rateFor, type Currency, type Rates } from "@/lib/currency";

type CurrencyContextValue = {
  /** Preferred display currency from the user's profile. */
  currency: Currency;
  /** Cached daily rates (base INR), or null when none exist yet. */
  rates: Rates;
  /** Effective rate applied to INR amounts (1 when falling back to INR). */
  rate: number;
  /** Format an INR amount in the effective display currency. */
  fmt: (amountInINR: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "INR",
  rates: null,
  rate: 1,
  fmt: (v) => convertAndFormat(v, "INR", null),
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const getProfileFn = useServerFn(getProfile);
  const getRatesFn = useServerFn(getLatestRates);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: latest } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => getRatesFn(),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const value = useMemo<CurrencyContextValue>(() => {
    const preferred = (profile?.currency as Currency | undefined) ?? "INR";
    const rates = latest?.rates ?? null;
    const { currency, rate } = rateFor(preferred, rates);
    return {
      currency,
      rates,
      rate,
      fmt: (amountInINR: number) => convertAndFormat(amountInINR, preferred, rates),
    };
  }, [profile?.currency, latest]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
