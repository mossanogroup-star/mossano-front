import { cn } from "../lib/cn";
import type { Media } from "../api/types";

interface SlabProps {
  media?: Media | null;
  /** Fallback when there is no Media record — a denormalised card URL. */
  url?: string | null;
  alt: string;
  /** The `sizes` attribute. Get this right or srcset does nothing useful. */
  sizes?: string;
  className?: string;
  imgClassName?: string;
  /** Above-the-fold imagery: the hero, and the first slab on a stone page. */
  priority?: boolean;
  aspect?: "portrait" | "landscape" | "square" | "wide" | "auto";
}

const ASPECT: Record<string, string> = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  square: "aspect-square",
  wide: "aspect-[16/9]",
  auto: "",
};

/**
 * A slab photograph.
 *
 * DESIGN.md's governing rule is that the stone is the content and everything
 * else is a caption, so this is deliberately not a card: no border, no radius,
 * no shadow, just the photograph and the frame that crops it.
 *
 * The srcset comes from the server rather than being assembled here, because
 * only the server knows whether the file is on Cloudinary — where a width is a
 * URL transformation — or on local disk, where it is not.
 */
export function Slab({
  media,
  url,
  alt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
  imgClassName,
  priority = false,
  aspect = "portrait",
}: SlabProps) {
  const src = media?.url ?? url ?? null;

  if (!src) {
    // A missing photograph is stated, not faked with a placeholder graphic —
    // most of the catalogue has imagery, and a stone that does not should look
    // incomplete to the team rather than passable to a customer.
    return (
      <div
        className={cn(
          "slab-frame grid place-items-center",
          ASPECT[aspect],
          className,
        )}
        aria-hidden="true"
      >
        <span className="label">Photography on request</span>
      </div>
    );
  }

  const srcSet = media?.srcset?.length
    ? media.srcset.map((s) => `${s.url} ${s.width}w`).join(", ")
    : undefined;

  return (
    <div className={cn("slab-frame", ASPECT[aspect], className)}>
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        width={media?.width ?? undefined}
        height={media?.height ?? undefined}
        loading={priority ? "eager" : "lazy"}
        // The attribute that actually moves the hero up the network queue —
        // loading="eager" alone only stops it being deferred.
        //
        // Spelled lowercase and spread, because React 18 does not know the
        // camelCase `fetchPriority` prop and passes it through to the DOM with a
        // console error on every image. React 19 accepts the camelCase form; when
        // this upgrades, this can become a plain prop.
        {...(priority ? { fetchpriority: "high" } : {})}
        decoding={priority ? "sync" : "async"}
        className={imgClassName}
      />
    </div>
  );
}
