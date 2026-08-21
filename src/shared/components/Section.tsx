import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

/**
 * A page section, with the heading treatment DESIGN.md specifies: a hairline
 * rule, a small tracked label, then the display heading. Centralised because
 * three pages hand-rolling the same three elements is how a design system
 * quietly stops being one.
 */
export function SectionHeading({
  label,
  title,
  intro,
  action,
  align = "left",
  tone = "dark",
  className,
}: {
  label?: string;
  title: string;
  intro?: string;
  action?: { to: string; label: string };
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-prose",
          align === "center" && "mx-auto text-center",
        )}
      >
        <div className={cn("rule", align === "center" && "mx-auto")} />
        {label && (
          <p className={cn("label mt-4", tone === "light" && "text-ivory/55")}>
            {label}
          </p>
        )}
        <h2 className={cn("h-section mt-2", tone === "light" && "text-ivory")}>
          {title}
        </h2>
        {intro && (
          <p
            className={cn(
              "mt-4 text-pretty text-[0.95rem] leading-relaxed",
              tone === "light" ? "text-ivory/70" : "text-ink-soft",
            )}
          >
            {intro}
          </p>
        )}
      </div>

      {action && (
        <Link
          to={action.to}
          className={cn(
            "shrink-0 border-b pb-1 font-sans text-[0.66rem] uppercase tracking-label transition-colors",
            tone === "light"
              ? "border-ivory/30 text-ivory/80 hover:border-ivory hover:text-ivory"
              : "border-ink/25 text-ink-soft hover:border-ink hover:text-ink",
          )}
        >
          {action.label}
        </Link>
      )}
    </header>
  );
}

export function Section({
  children,
  className,
  tone = "light",
  id,
}: {
  children: ReactNode;
  className?: string;
  /** "light" is the ivory surface; "dark" is the umber band. */
  tone?: "light" | "dark" | "deep";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 sm:py-28",
        tone === "dark" && "bg-umber text-ivory",
        tone === "deep" && "bg-ivory-deep",
        className,
      )}
    >
      <div className="shell">{children}</div>
    </section>
  );
}

/**
 * What a listing shows when there is nothing to show.
 *
 * Worth a shared component rather than an inline paragraph: most of this
 * catalogue's optional data has not been supplied yet, so empty states are
 * common, and the difference between "no results" and "this page is broken" is
 * entirely in how they read.
 */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-t border-ivory-dark py-20 text-center">
      <p className="font-display text-[1.1rem] uppercase tracking-wide">
        {title}
      </p>
      {body && (
        <p className="mx-auto mt-3 max-w-prose text-[0.9rem] text-ink-soft">
          {body}
        </p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
