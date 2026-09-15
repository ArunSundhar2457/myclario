import { cn } from "@/lib/utils";

export function ClarioBrand({
  dark = false,
  compact = false,
}: {
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <span className="flex items-center gap-2.5" aria-label="Clario">
      <svg
        viewBox="0 0 72 72"
        className={cn("shrink-0", compact ? "h-8 w-8" : "h-10 w-10")}
        aria-hidden="true"
      >
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
      <span>
        <span
          className={cn(
            "block font-display font-semibold leading-none",
            compact ? "text-lg" : "text-xl",
            dark ? "text-navy-foreground" : "text-foreground",
          )}
        >
          Clario
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 block text-[9px] leading-none",
              dark ? "text-navy-foreground/60" : "text-muted-foreground",
            )}
          >
            Your money. Your day. Sorted.
          </span>
        )}
      </span>
    </span>
  );
}
