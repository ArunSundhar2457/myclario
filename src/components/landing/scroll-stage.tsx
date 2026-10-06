import { useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** True on desktop-sized screens (where sections pin to the screen). */
export function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

type Offset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

/**
 * A landing-page chapter that pins to the screen on desktop while the user's
 * scroll scrubs its animation (progress 0 → 1, fully reversible). On phones the
 * section scrolls normally, but its animation is still driven by scroll position.
 * With reduced motion nothing pins and progress is fixed at 1 (final state).
 */
export function ScrollStage({
  id,
  labelledBy,
  className,
  track,
  stageClassName,
  mobileOffset = ["start 85%", "end 70%"],
  children,
}: {
  id?: string;
  labelledBy: string;
  className?: string;
  /** Desktop scroll-track height, e.g. "lg:h-[240vh]". */
  track: string;
  stageClassName?: string;
  mobileOffset?: Offset;
  children: (progress: MotionValue<number>) => ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  const pinned = useScroll({ target: ref, offset: ["start start", "end end"] });
  const flowing = useScroll({ target: ref, offset: mobileOffset });
  const progress = useTransform(
    [pinned.scrollYProgress, flowing.scrollYProgress],
    ([p, f]: number[]) => (reduce ? 1 : desktop ? p : f),
  );

  return (
    <section
      id={id}
      ref={ref}
      aria-labelledby={labelledBy}
      className={cn("relative overflow-x-clip", className, !reduce && track)}
    >
      <div
        className={cn(
          !reduce &&
            "lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-[640px] lg:flex-col lg:justify-center lg:overflow-hidden",
          stageClassName,
        )}
      >
        {children(progress)}
      </div>
    </section>
  );
}
