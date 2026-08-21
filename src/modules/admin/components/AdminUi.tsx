import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import type { Availability } from "@/shared/api/types";

/** Page header for every admin screen. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ivory-dark pb-6">
      <div>
        <h1 className="font-display text-[1.35rem] uppercase tracking-wide">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[0.85rem] text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

/** A number worth reading at a glance. Flat, per DESIGN.md — no cards. */
export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "attention";
}) {
  return (
    <div className="border-t border-ivory-dark pt-4">
      <p className="label">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-[1.85rem] leading-none tabular-nums",
          tone === "attention" && Number(value) > 0 && "text-brass",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-[0.75rem] text-ink-faint">{hint}</p>}
    </div>
  );
}

const AVAILABILITY_DOT: Record<Availability, string> = {
  available: "bg-[#1fb658]",
  on_hold: "bg-[#d9a318]",
  sold: "bg-[#b23b2e]",
  verification_required: "bg-ink-faint",
};

/**
 * The availability control, inline in a list row.
 *
 * Admin Scope §2's central action, and the one the team performs most. It is a
 * select rather than a dialog because the alternative — open a stone, edit, save,
 * go back — is four interactions for a change the team makes dozens of times a
 * day while walking the yard.
 */
export function AvailabilitySelect({
  value,
  onChange,
  disabled,
  labels,
}: {
  value: Availability;
  onChange: (next: Availability) => void;
  disabled?: boolean;
  labels: Record<string, string>;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", AVAILABILITY_DOT[value])}
        aria-hidden="true"
      />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Availability)}
        className="border-0 border-b border-transparent bg-transparent py-0.5 pr-5 font-sans text-[0.78rem] hover:border-ink/30 focus:border-ink focus:outline-none disabled:opacity-50"
        aria-label="Availability"
      >
        {Object.entries(labels).map(([slug, label]) => (
          <option key={slug} value={slug}>
            {label}
          </option>
        ))}
      </select>
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brass" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-block border px-2 py-0.5 font-sans text-[0.6rem] uppercase tracking-label",
        tone === "brass" && "border-brass/50 text-brass",
        tone === "muted" && "border-ink/15 text-ink-faint",
        tone === "neutral" && "border-ink/25 text-ink-soft",
      )}
    >
      {children}
    </span>
  );
}

/** A table that becomes a stack of rows on a phone. */
export function DataTable({
  head,
  children,
  empty,
}: {
  head: string[];
  children: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-ivory-dark">
            {/* Keyed by position, not by label: a table can legitimately have
                more than one unlabelled column (an image, a row of actions),
                and keying on the text collides on the empty string. The header
                is static and never reorders, so the index is stable. */}
            {head.map((h, i) => (
              <th key={i} scope="col" className="label whitespace-nowrap py-3 pr-6 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function TableEmpty({ message }: { message: string }) {
  return (
    <p className="border-t border-ivory-dark py-16 text-center text-[0.9rem] text-ink-faint">
      {message}
    </p>
  );
}

export function AdminError({ error }: { error: unknown }) {
  return (
    <p
      className="border border-[#b23b2e]/30 bg-[#b23b2e]/5 px-4 py-3 text-[0.85rem] text-[#b23b2e]"
      role="alert"
    >
      {error instanceof Error ? error.message : "Something went wrong."}
    </p>
  );
}
