import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { publicQueries } from "@/shared/api/publicQueries";
import { Section, EmptyState } from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { Slab } from "@/shared/components/Slab";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";

/**
 * Website §6 — Shop by Look.
 *
 * "This page should be highly visual", and there is no separate look
 * photography to draw on, so each tile borrows the lead slab from the stones
 * tagged to it. That is also why an empty look is shown as unavailable rather
 * than linked: with nothing tagged, the tile would have no image and the page
 * behind it would have no stones.
 */
export function LookIndexPage() {
  const { data } = useQuery(publicQueries.looks());
  const looks = data ?? [];
  const populated = looks.filter((l) => !l.isEmpty);

  return (
    <Section className="pt-24 sm:pt-28">
      <header className="max-w-2xl">
        <div className="rule" />
        <p className="label mt-4">Shop by Look</p>
        <h1 className="h-display mt-2">Begin With the Mood</h1>
        <p className="mt-6 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
          Quiet or dramatic, warm or dark. Most specifications start from a
          feeling long before they settle on a material.
        </p>
      </header>

      {populated.length ? (
        <div className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {populated.map((look, i) => (
            <Link key={look.slug} to={look.href} className="group block">
              <Slab
                url={look.image}
                alt={look.imageAlt ?? look.label}
                aspect="portrait"
                priority={i < 3}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h2 className="font-display text-[1.05rem] uppercase tracking-wide">
                  {look.label}
                </h2>
                <span className="label tabular-nums">
                  {look.count} lot{look.count === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Looks are being assigned"
          body="MOSSANO is categorising the catalogue."
        />
      )}

      {/* Named honestly rather than hidden: the categories exist, the stock for
          them does not yet, and a customer looking for Bookmatch should be able
          to ask rather than conclude MOSSANO does not do it. */}
      {populated.length > 0 && looks.length > populated.length && (
        <p className="mt-14 border-t border-ivory-dark pt-8 text-[0.85rem] text-ink-faint">
          Also sourced on request:{" "}
          {looks
            .filter((l) => l.isEmpty)
            .map((l) => l.label)
            .join(", ")}
          .
        </p>
      )}
    </Section>
  );
}

export function LookDetailPage() {
  const { slug = "" } = useParams();
  const { data, isError } = useQuery(publicQueries.look(slug));
  const { whatsapp } = useSiteConfig();

  const label = (data?.meta?.label as string) ?? slug.replace(/-/g, " ");
  const items = data?.items ?? [];

  return (
    <Section className="pt-24 sm:pt-28">
      <header className="max-w-2xl">
        <div className="rule" />
        <p className="label mt-4">
          <Link to="/look" className="underline-offset-4 hover:underline">
            Shop by Look
          </Link>
        </p>
        <h1 className="h-display mt-2">{label}</h1>
      </header>

      <div className="mt-14">
        {items.length ? (
          <StoneGrid stones={items} />
        ) : (
          <EmptyState
            title={
              isError ? "Unknown look" : `No ${label} stone on the site yet`
            }
            body="MOSSANO's supplier network reaches well beyond what is listed here."
            action={
              <WhatsAppButton
                href={whatsapp.general}
                label={`Ask about ${label.toLowerCase()} stone`}
              />
            }
          />
        )}
      </div>
    </Section>
  );
}
