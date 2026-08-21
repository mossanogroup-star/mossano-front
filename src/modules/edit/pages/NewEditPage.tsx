import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { publicQueries } from "@/shared/api/publicQueries";
import {
  Section,
  SectionHeading,
  EmptyState,
} from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import type { Edit } from "@/shared/api/types";

/**
 * Website §2 — the three bands.
 *
 * Current, Next and Upcoming are not three copies of a listing with different
 * headings: the document gives each a different customer action, because each
 * represents a different commercial state. Current stock can be reserved, the
 * Next Edit can be pre-booked, and the Upcoming Edit is only a preview. The
 * action comes down from the server with the Edit, so the two cannot drift.
 */
function EditBand({ edit, index }: { edit: Edit; index: number }) {
  const stones = edit.stones ?? [];

  return (
    <Section tone={index % 2 === 0 ? "light" : "deep"} id={edit.slug}>
      <SectionHeading
        label={edit.statusLabel}
        title={edit.title}
        intro={edit.subtitle || edit.description || undefined}
        action={{ to: edit.href, label: `View ${edit.title}` }}
      />

      <div className="mt-14">
        {stones.length ? (
          <>
            <StoneGrid
              stones={stones.slice(0, 9)}
              priorityCount={index === 0 ? 3 : 0}
            />
            {stones.length > 9 && (
              <div className="mt-14 text-center">
                <Link to={edit.href} className="btn-outline">
                  All {edit.stoneCount} stones in {edit.title}
                </Link>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Being curated"
            body={`The ${edit.title} selection is still being confirmed.`}
          />
        )}
      </div>
    </Section>
  );
}

export function NewEditPage() {
  const { data } = useQuery(publicQueries.edits());
  const { whatsapp } = useSiteConfig();

  const edits = data ?? [];

  return (
    <>
      <Section tone="deep" className="pb-0 pt-24 sm:pt-32">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4">The Edit</p>
          <h1 className="h-display mt-2">Curated, Month by Month</h1>
          <p className="mt-6 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
            MOSSANO publishes a new selection each month. What is available now,
            what arrives next, and an early view of what is coming.
          </p>
        </div>
      </Section>

      {edits.length ? (
        edits.map((edit, i) => <EditBand key={edit.id} edit={edit} index={i} />)
      ) : (
        <Section>
          <EmptyState
            title="No Edit is published yet"
            body="The current selection is being verified before it goes live. MOSSANO can tell you what is in stock today."
            action={
              <WhatsAppButton
                href={whatsapp.general}
                label="Ask what is available"
              />
            }
          />
        </Section>
      )}
    </>
  );
}
