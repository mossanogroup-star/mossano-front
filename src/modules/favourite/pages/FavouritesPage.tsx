import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { publicQueries } from "@/shared/api/publicQueries";
import { useFavourites } from "@/shared/hooks/useFavourites";
import { Section, EmptyState } from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";

/**
 * Website §5 — Favourites.
 *
 * The only public page that cannot be server-rendered with its content, and it
 * is the correct exception: the list lives on the device, so the server has no
 * idea what this visitor saved. It renders its empty frame on the server and
 * fills in on hydration, which is exactly why favourites are excluded from the
 * SSR prefetch rather than being made to work halfway.
 */
export function FavouritesPage() {
  const { slugs, count, clear } = useFavourites();
  const { whatsapp } = useSiteConfig();
  const { data, isLoading } = useQuery(publicQueries.favourites(slugs));

  const stones = data ?? [];

  return (
    <Section className="pt-24 sm:pt-28">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4">Favourites</p>
          <h1 className="h-display mt-2">Your Shortlist</h1>
          <p className="mt-6 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
            Saved on this device. No account needed — and nothing here is shared
            with MOSSANO until you send it.
          </p>
        </div>

        {count > 0 && (
          <button
            type="button"
            onClick={clear}
            className="border-b border-ink/25 pb-1 font-sans text-[0.66rem] uppercase tracking-label text-ink-faint transition-colors hover:border-ink hover:text-ink"
          >
            Clear all
          </button>
        )}
      </header>

      <div className="mt-14">
        {count === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            body="Save a stone from anywhere on the site and it will be here when you come back."
            action={
              <Link to="/shop" className="btn-outline">
                Browse the Stone Shop
              </Link>
            }
          />
        ) : isLoading ? (
          <div className="h-64" aria-busy="true" />
        ) : stones.length ? (
          <>
            <StoneGrid stones={stones} />

            {/* The point of a shortlist is sending it. Composed as a plain
                link so it survives with JavaScript disabled. */}
            <div className="mt-20 border-t border-ivory-dark pt-10">
              <p className="max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
                Send the shortlist to MOSSANO and they will confirm what is
                available, with actual slab photography.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <WhatsAppButton
                  href={`https://wa.me/${whatsapp.number}?text=${encodeURIComponent(
                    `Hi MOSSANO, I am interested in these lots: ${stones
                      .map((s) => `${s.mossanoCode} ${s.name}`)
                      .join(", ")}.`,
                  )}`}
                  label="Send this shortlist"
                />
                <Link to="/contact" className="btn-outline">
                  Send by email instead
                </Link>
              </div>
            </div>
          </>
        ) : (
          // Saved slugs that no longer resolve — withdrawn lots, or a list
          // carried over from an older version of the catalogue.
          <EmptyState
            title="These stones are no longer listed"
            body="The lots you saved have been withdrawn. MOSSANO can suggest what has replaced them."
            action={<WhatsAppButton href={whatsapp.general} label="Ask what is similar" />}
          />
        )}
      </div>
    </Section>
  );
}
