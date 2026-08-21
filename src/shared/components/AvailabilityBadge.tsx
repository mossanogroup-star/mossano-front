import { cn } from "../lib/cn";
import type { Availability } from "../api/types";

/**
 * Admin Scope §2's four states, as the customer sees them.
 *
 * A dot rather than a coloured pill: DESIGN.md rules out anything that reads as
 * interface chrome over the photography, and the requirement document's own
 * 🟢🟡🔴⚪ notation is already a dot. The colours are the semantic ones, kept
 * deliberately outside the six-token brand palette so they read as status
 * rather than as decoration.
 */
const DOT: Record<Availability, string> = {
  available: "bg-[#1fb658]",
  on_hold: "bg-[#d9a318]",
  sold: "bg-[#b23b2e]",
  verification_required: "bg-ink-faint",
};

interface Props {
  availability: Availability;
  label: string;
  /** The "verified today" line from Website §2 and §4. */
  verifiedLabel?: string | null;
  isVerifiedLot?: boolean;
  className?: string;
  /** Over photography the type has to be light. */
  tone?: "dark" | "light";
}

export function AvailabilityBadge({
  availability,
  label,
  verifiedLabel,
  isVerifiedLot,
  className,
  tone = "dark",
}: Props) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}
    >
      <span className="inline-flex items-center gap-2">
        <span
          className={cn("h-1.5 w-1.5 rounded-full", DOT[availability])}
          aria-hidden="true"
        />
        <span
          className={cn(
            "font-sans text-[0.66rem] uppercase tracking-label",
            tone === "light" ? "text-ivory/85" : "text-ink-soft",
          )}
        >
          {label}
        </span>
      </span>

      {/* Website §2: "MOSSANO verified lot". Only shown when it is actually
          earned — available *and* recently checked — because a trust badge that
          appears on everything stops meaning anything. */}
      {isVerifiedLot && (
        <span
          className={cn(
            "border px-2 py-0.5 font-sans text-[0.6rem] uppercase tracking-label",
            tone === "light"
              ? "border-brass-light/60 text-brass-light"
              : "border-brass/50 text-brass",
          )}
        >
          MOSSANO verified lot
        </span>
      )}

      {verifiedLabel && (
        <span
          className={cn(
            "font-sans text-[0.66rem] tracking-wide",
            tone === "light" ? "text-ivory/55" : "text-ink-faint",
          )}
        >
          {verifiedLabel}
        </span>
      )}
    </div>
  );
}
