import { Link } from "react-router-dom";
import { Slab } from "./Slab";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { FavouriteButton } from "./FavouriteButton";
import { WhatsAppButton } from "./WhatsAppButton";
import { cn } from "../lib/cn";
import type { StoneCard as StoneCardType } from "../api/types";

interface Props {
  stone: StoneCardType;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /**
   * h3 under a section heading (home, an Edit); h2 when the grid *is* the page
   * and only the h1 sits above it (Stone Shop, a look, favourites). Wrong here
   * skips a heading level for anyone navigating by them.
   */
  headingLevel?: 2 | 3;
}

/**
 * A stone in a grid: the photograph carries the tile, the type is a caption.
 *
 * Origin is omitted when absent rather than shown as "On request" — twenty
 * cards saying that would make the missing field the loudest thing on the page.
 * The stone page states it properly.
 */
export function StoneCard({ stone, className, priority, sizes, headingLevel = 3 }: Props) {
  const Heading = (headingLevel === 2 ? "h2" : "h3") as "h2" | "h3";

  return (
    <article className={cn("group relative", className)}>
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
            {/* The card's only link, stretched over the whole tile by the
                ::after. That is what lets the two actions beside it be a real
                button and a real anchor — an <a> cannot legally nest inside
                another <a>, which it would have to if the Link wrapped the
                card. */}
            <Link
              to={stone.href}
              className="after:absolute after:inset-0 after:content-[''] hover:text-brass"
            >
              {stone.name}
            </Link>
          </Heading>
          {stone.origin && <p className="mt-1 text-[0.8rem] text-ink-faint">{stone.origin}</p>}
        </div>

        {/* Phase-1 feedback §3 — save it, or ask about it, without opening the
            lot first. z-10 lifts both clear of the stretched link above. */}
        <div className="relative z-10 mt-1 flex shrink-0 items-center gap-3">
          <WhatsAppButton
            href={stone.whatsapp.enquire}
            variant="icon"
            label={`Ask MOSSANO about ${stone.name} on WhatsApp`}
          />
          <FavouriteButton slug={stone.slug} name={stone.name} />
        </div>
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
