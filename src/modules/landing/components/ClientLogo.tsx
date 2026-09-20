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
    // Greyscale at rest keeps two dozen brand palettes from fighting the
    // page; colour on hover confirms the logo is real. 85% rather than 70%:
    // several of the marks are pale to begin with and were disappearing into
    // the ivory once desaturated on top of that.
    logo && "opacity-85 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0",
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
