import { cn } from "../lib/cn";

/**
 * Phase-2 feedback §6, revised in Phase 3 — MOSSANO with a small ™ raised above
 * the final O, on the header and the footer only.
 *
 * Opt-in rather than automatic: the client wants the mark on those two logos
 * and nowhere else, so the admin login, the chatbot header and the admin
 * sidebar render the wordmark plain.
 *
 * Rendered rather than baked into the string so it can be sized independently
 * of the wordmark's wide `tracking-wordmark`, which would otherwise push it
 * away from the O it belongs to. Sized up on the client's instruction across
 * three passes — 0.42em, 0.55em, 0.8em, now 1.05em, which is the glyph at full
 * text size. It takes no width in the line because it is positioned, so growing
 * it moves nothing else; past this it would start to overhang the shell.
 *
 * `aria-hidden` on the symbol: a screen reader announcing "MOSSANO trade mark"
 * every time the header is read is noise, and the mark is decoration to a
 * listener even though it is legally meaningful in print.
 */
export function Wordmark({
  text = "MOSSANO",
  tm = false,
  className,
}: {
  text?: string;
  /** The ™. On for the header and footer logos, off everywhere else. */
  tm?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("wordmark relative whitespace-nowrap", className)}>
      {text}
      {tm && (
        <sup
          aria-hidden="true"
          className="absolute -top-[0.08em] ml-[0.14em] text-[1.05em] font-normal leading-none tracking-normal"
        >
          ™
        </sup>
      )}
    </span>
  );
}
