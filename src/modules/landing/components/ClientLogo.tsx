import { Slab } from "@/shared/components/Slab";
import { cn } from "@/shared/lib/cn";
import type { ClientTile } from "@/shared/api/types";

/**
 * One client, logo or name.
 *
 * A logo is not a photograph: it must sit whole inside its box, so this uses
 * `object-contain` rather than the `cover` every other image on the site uses.
 * Logos also arrive in wildly different aspect ratios and background colours —
 * a wide wordmark beside a square roundel — so each gets the same fixed height
 * and centres within it, which is what makes a row of them look deliberate.
 *
 * Without a logo the name is rendered instead. That is not a placeholder: a
 * category is never held up waiting for an image file.
 */
export function ClientLogo({ client, className }: { client: ClientTile; className?: string }) {
  const body = client.logo ? (
    <Slab
      media={client.logo}
      alt={client.name}
      aspect="auto"
      sizes="200px"
      className="h-full w-full"
      imgClassName="h-full w-full object-contain"
    />
  ) : (
    <span className="whitespace-nowrap font-display text-[0.95rem] uppercase tracking-wide text-ink-soft">
      {client.name}
    </span>
  );

  const shell = cn(
    "flex h-16 w-full items-center justify-center px-4 transition-opacity",
    // Greyscale at rest keeps two dozen brand palettes from fighting the
    // page; colour on hover confirms the logo is real.
    client.logo && "opacity-70 grayscale hover:opacity-100 hover:grayscale-0",
    className,
  );

  if (client.website) {
    return (
      <a
        href={client.website}
        target="_blank"
        rel="noopener noreferrer"
        className={shell}
        aria-label={client.name}
      >
        {body}
      </a>
    );
  }

  return (
    <div className={shell} title={client.name}>
      {body}
    </div>
  );
}
