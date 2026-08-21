import { Link } from "react-router-dom";
import { Slab } from "./Slab";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { FavouriteButton } from "./FavouriteButton";
import { cn } from "../lib/cn";
import type { StoneCard as StoneCardType } from "../api/types";

interface Props {
  stone: StoneCardType;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /**
   * The heading level for the stone's name.
   *
   * A card is h3 when it sits under a section heading (the home page, an Edit),
   * and h2 when the grid *is* the page and the only thing above it is the h1 —
   * the Stone Shop, a look, favourites. Getting this wrong skips a level, and a
   * screen-reader user navigating by heading is left wondering what they missed.
   */
  headingLevel?: 2 | 3;
}

/**
 * A stone in a grid.
 *
 * The photograph carries the tile; the type underneath is a caption. Origin is
 * shown when the client has supplied it and simply omitted when they have not —
 * "Origin: On request" on every card in a grid of twenty would turn an absent
 * field into the loudest thing on the page. The stone page states it properly.
 */
export function StoneCard({ stone, className, priority, sizes, headingLevel = 3 }: Props) {
  const Heading = (headingLevel === 2 ? "h2" : "h3") as "h2" | "h3";

  return (
    <article className={cn("group relative", className)}>
      <Link to={stone.href} className="block">
        <Slab
          media={stone.primaryImage}
          url={stone.primaryImageUrl}
          alt={`${stone.name} — natural stone slab`}
          priority={priority}
          sizes={sizes}
        />

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label">{stone.mossanoCode}</p>
            <Heading className="mt-1.5 font-display text-[1.05rem] uppercase leading-tight tracking-wide">
              {stone.name}
            </Heading>
            {stone.origin && <p className="mt-1 text-[0.8rem] text-ink-faint">{stone.origin}</p>}
          </div>

          {/* Sits outside the Link's flow but inside the card, so the whole
              tile stays clickable without the button swallowing the click. */}
          <FavouriteButton slug={stone.slug} name={stone.name} className="mt-1 shrink-0" />
        </div>

        <AvailabilityBadge
          className="mt-3"
          availability={stone.availability}
          label={
            // Lot size is the more useful line where it is known — the brief's
            // own example card reads "4 slabs available".
            stone.slabCount
              ? `${stone.slabCount} slab${stone.slabCount === 1 ? "" : "s"} · ${stone.availabilityLabel}`
              : stone.availabilityLabel
          }
          isVerifiedLot={stone.isVerifiedLot}
        />
      </Link>
    </article>
  );
}

/** The grid stones are laid out in, so spacing never drifts between pages. */
export function StoneGrid({
  stones,
  priorityCount = 3,
  className,
  headingLevel,
}: {
  stones: StoneCardType[];
  priorityCount?: number;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {stones.map((stone, i) => (
        <StoneCard
          key={stone.id}
          stone={stone}
          priority={i < priorityCount}
          headingLevel={headingLevel}
        />
      ))}
    </div>
  );
}
