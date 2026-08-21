import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { publicQueries } from "@/shared/api/publicQueries";
import { Section, EmptyState } from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { Slab } from "@/shared/components/Slab";

/** One Edit in full. The CTA wording follows its band — see NewEditPage. */
export function EditDetailPage() {
  const { slug = "" } = useParams();
  const { data, isError } = useQuery(publicQueries.edit(slug));

  if (isError) {
    return (
      <Section>
        <EmptyState
          title="Edit not found"
          body="This collection may have been archived."
          action={
            <Link to="/new-edit" className="btn-outline">
              All Edits
            </Link>
          }
        />
      </Section>
    );
  }

  if (!data)
    return (
      <Section>
        <div className="h-64" />
      </Section>
    );

  return (
    <>
      {data.coverImage ? (
        <section className="relative isolate min-h-[52vh] overflow-hidden bg-umber-deep">
          <Slab
            media={data.coverImage}
            alt=""
            aspect="auto"
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full"
            imgClassName="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-umber-deep/90 to-umber-deep/20"
            aria-hidden="true"
          />
          <div className="shell relative flex min-h-[52vh] flex-col justify-end pb-14 pt-28">
            <div className="rule" />
            <p className="label mt-4 text-ivory/60">{data.statusLabel}</p>
            <h1 className="h-display mt-2 text-ivory">{data.title}</h1>
            {data.subtitle && (
              <p className="mt-4 max-w-prose text-[0.95rem] text-ivory/75">{data.subtitle}</p>
            )}
          </div>
        </section>
      ) : (
        <Section tone="deep" className="pb-14 pt-28">
          <div className="rule" />
          <p className="label mt-4">{data.statusLabel}</p>
          <h1 className="h-display mt-2">{data.title}</h1>
          {data.subtitle && (
            <p className="mt-4 max-w-prose text-[0.95rem] text-ink-soft">{data.subtitle}</p>
          )}
        </Section>
      )}

      <Section>
        {data.description && (
          <p className="mb-14 max-w-prose text-[1rem] leading-relaxed text-ink-soft">
            {data.description}
          </p>
        )}

        {data.stones.length ? (
          <StoneGrid stones={data.stones} />
        ) : (
          <EmptyState
            title="No stones in this Edit yet"
            body="MOSSANO is still confirming this selection."
          />
        )}
      </Section>
    </>
  );
}
