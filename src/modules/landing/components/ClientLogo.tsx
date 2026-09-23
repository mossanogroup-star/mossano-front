import { cn } from "@/shared/lib/cn";
import type { ClientTile } from "@/shared/api/types";

/**
 * One client, logo or name.
 *
 * Deliberately not a Slab: that wrapper paints `bg-ivory-deep` behind the image
 * and crops with `object-cover`, which is right for a photograph of stone and
 * wrong for a logo — it boxed every mark in a grey tile. A logo has its own
 * transparent edge and must sit whole and unframed on the page background.
 *
 * Logos arrive in wildly different aspect ratios — a wide wordmark beside a
 * square roundel — so the box is a fixed height and the image is capped on both
 * axes. Tall marks run out of height, wide ones run out of width, and neither
 * can out-shout the other, which is what makes a row of them look deliberate.
 *
 * Without a logo the name is rendered instead. That is not a placeholder: a
 * category is never held up waiting for an image file.
 */
export function ClientLogo({ client, className }: { client: ClientTile; className?: string }) {
  const logo = client.logo;

  const body = logo ? (
    <img
      src={logo.url}
      srcSet={
        logo.srcset?.length ? logo.srcset.map((s) => `${s.url} ${s.width}w`).join(", ") : undefined
      }
      sizes={logo.srcset?.length ? "180px" : undefined}
      alt={client.name}
      loading="lazy"
      decoding="async"
      className="max-h-full w-auto max-w-full object-contain"
    />
  ) : (
    <span className="whitespace-nowrap font-display text-[0.95rem] uppercase tracking-wide text-ink-soft">
      {client.name}
    </span>
  );

  const shell = cn(
    "flex h-14 w-full items-center justify-center sm:h-16 lg:h-20",
    // Phase-3 feedback — every logo in its own colours, at rest and on hover.
    // They were desaturated until hovered, which made the strip read as a
    // muted graphic; the client wants the marks shown as their owners drew
    // them. Everywhere: the home strip and the Clients page share this file.
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
