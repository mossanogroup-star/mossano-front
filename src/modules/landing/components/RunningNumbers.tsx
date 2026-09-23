import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Phase-3 feedback — the running numbers in the hero, in the client's own
 * words: "in past 15 years, 45 lakhs square feet +". Their figure leads,
 * because area delivered is the one number an architect can compare against
 * their own project; the brochure's two follow it.
 *
 * ⚠ The 15 years here and the "12+ years of experience" on the About page
 * cannot both be right — that figure comes from the brochure (CLIENT-FACTS.md)
 * and is left alone until the client says which stands.
 *
 * Counted in lakhs rather than as 4,500,000: it is how the client said it, and
 * a seven-digit number rolling upward reads as noise.
 */
const STATS = [
  {
    value: 45,
    suffix: " Lakh+",
    label: "Square feet delivered",
    note: "In the past 15 years",
  },
  { value: 30000, suffix: "+", label: "Sq. ft. facility" },
  { value: 6000, suffix: "+", label: "Tons imported a year" },
];

const format = (n: number) => n.toLocaleString("en-IN");

/**
 * Counts up once, when the number is actually on screen.
 *
 * It renders its final value on the server and animates only after hydration,
 * so a crawler — and anyone the animation never reaches — reads the real
 * figure rather than a zero. Under prefers-reduced-motion it simply stays at
 * the final value: a number sprinting upward is the definition of what that
 * setting asks us not to do.
 */
function useCountUp(target: number, durationMs = 1400) {
  const [display, setDisplay] = useState(target);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / durationMs, 1);
          // Ease-out: the count arrives rather than stopping dead.
          setDisplay(Math.round(target * (1 - (1 - progress) ** 3)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        setDisplay(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, durationMs]);

  return { display, ref };
}

/** Over the hero photograph the type has to be light. */
type Tone = "dark" | "light";

function Stat({
  value,
  suffix,
  label,
  note,
  tone,
}: (typeof STATS)[number] & { note?: string; tone: Tone }) {
  const { display, ref } = useCountUp(value);

  return (
    <div
      className={cn("border-t pt-4", tone === "light" ? "border-ivory/25" : "border-ivory-dark")}
    >
      <p
        ref={ref}
        className={cn(
          "font-display text-[1.9rem] leading-none tabular-nums",
          tone === "light" ? "text-brass-light" : "text-brass",
        )}
      >
        {format(display)}
        {suffix}
      </p>
      <p className={cn("label mt-2", tone === "light" ? "text-ivory/70" : "text-ink-soft")}>
        {label}
      </p>
      {note && (
        <p
          className={cn(
            "mt-1 text-[0.8rem] leading-relaxed",
            tone === "light" ? "text-ivory/50" : "text-ink-faint",
          )}
        >
          {note}
        </p>
      )}
    </div>
  );
}

export function RunningNumbers({ className, tone = "dark" }: { className?: string; tone?: Tone }) {
  return (
    <div className={className}>
      {STATS.map((stat) => (
        <Stat key={stat.label} {...stat} tone={tone} />
      ))}
    </div>
  );
}
