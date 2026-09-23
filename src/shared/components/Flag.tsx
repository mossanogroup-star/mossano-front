import { cn } from "../lib/cn";

/**
 * Phase-3 feedback — "we want country's flags, not the name".
 *
 * There is no country table in this file, and deliberately so. A stone stores
 * an ISO code, every code in the picker comes from countries.generated.js on
 * the server, and both that list and the images are derived from the same
 * `flag-icons` package — so a code that reaches here always has a file behind
 * it and the URL can simply be built.
 *
 * WebP at 48×36 rather than SVG: see scripts/build-flags.mjs. A flag is never
 * wider than a line of text here, and the vector set was 2.5MB to draw what
 * 122KB of raster draws identically at this size.
 *
 * Self-hosted rather than a CDN: the storefront is server-rendered and a flag
 * that arrives late is a layout shift on the one block of the stone page a
 * customer actually reads. Emoji flags were the shorter route and are not an
 * option — Windows renders them as two letters, which is the "name not flag"
 * this replaces.
 */
interface Props {
  /** ISO 3166-1 alpha-2, lowercase. */
  code: string | null | undefined;
  /** The country's name. Used as the label, and as the fallback without a code. */
  label?: string | null;
  /** Shown beside the flag. Off where the flags are the content themselves. */
  withName?: boolean;
  className?: string;
}

export function Flag({ code, label, withName = false, className }: Props) {
  // No code, no guess: the country's name is still the honest answer.
  if (!code) return <>{label ?? null}</>;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={`/flags/${code}.webp`}
        alt={withName ? "" : (label ?? "")}
        title={label ?? undefined}
        width={24}
        height={18}
        loading="lazy"
        className="h-[0.9em] w-auto shrink-0 border border-ink/10"
      />
      {withName && label && <span>{label}</span>}
    </span>
  );
}
