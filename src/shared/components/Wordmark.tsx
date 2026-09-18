import { cn } from "../lib/cn";

/**
 * Phase-2 feedback §6 — MOSSANO with a small ™ raised above the final O.
 *
 * Rendered rather than baked into the string so it can be sized independently:
 * at the wordmark's own tracking a full-size ™ reads as a seventh letter. It is
 * set at 0.42em, lifted, and given its own tighter tracking, because the
 * wordmark's wide `tracking-wordmark` would otherwise push it away from the O
 * it belongs to.
 *
 * `aria-hidden` on the symbol: a screen reader announcing "MOSSANO trade mark"
 * every time the header is read is noise, and the mark is decoration to a
 * listener even though it is legally meaningful in print.
 */
export function Wordmark({ text = "MOSSANO", className }: { text?: string; className?: string }) {
  return (
    <span className={cn("wordmark relative whitespace-nowrap", className)}>
      {text}
      <sup
        aria-hidden="true"
        className="absolute -top-[0.1em] ml-[0.12em] text-[0.42em] font-normal tracking-normal"
      >
        ™
      </sup>
    </span>
  );
}
