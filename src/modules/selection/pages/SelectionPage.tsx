import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Download } from "lucide-react";
import { publicQueries } from "@/shared/api/publicQueries";
import { Section, SectionHeading, EmptyState } from "@/shared/components/Section";
import { Slab } from "@/shared/components/Slab";
import { AvailabilityBadge } from "@/shared/components/AvailabilityBadge";
import { FavouriteButton } from "@/shared/components/FavouriteButton";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { EnquiryForm } from "@/modules/enquiry/components/EnquiryForm";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";

/**
 * Website §9 — a private selection, reached by an unguessable token with no
 * login. Availability is live rather than frozen when the link was sent: the
 * stones are references, so a lot that sold this morning says so.
 */
export function SelectionPage() {
  const { token = "" } = useParams();
  const { data, error, isLoading } = useQuery(publicQueries.selection(token));
  const [enquiring, setEnquiring] = useState(false);

  if (isLoading)
    return (
      <Section>
        <div className="h-96" />
      </Section>
    );

  if (error) {
    // The server distinguishes expired and revoked from "no such link", and
    // that distinction matters: an architect sent a legitimate selection three
    // months ago should be told it has expired, not that it never existed.
    const message = error instanceof ApiError ? error.message : "This selection link is not valid.";
    return (
      <Section className="pt-28">
        <EmptyState
          title="This selection is not available"
          body={message}
          action={
            <Link to="/contact" className="btn-outline">
              Contact MOSSANO
            </Link>
          }
        />
      </Section>
    );
  }

  if (!data) return null;

  return (
    <>
      <Section tone="dark" className="pt-28">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4 text-ivory/55">Private Selection · {data.reference}</p>
          <h1 className="h-display mt-2 text-ivory">{data.title}</h1>

          <dl className="mt-8 space-y-1 text-[0.95rem] text-ivory/75">
            <div className="flex gap-3">
              <dt className="text-ivory/45">Prepared for</dt>
              <dd>{data.customerName}</dd>
            </div>
            {data.projectName && (
              <div className="flex gap-3">
                <dt className="text-ivory/45">Project</dt>
                <dd>{data.projectName}</dd>
              </div>
            )}
          </dl>

          {data.introduction && (
            <p className="mt-8 max-w-prose text-[0.95rem] leading-relaxed text-ivory/70">
              {data.introduction}
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-4">
            <WhatsAppButton href={data.whatsapp} variant="light" label="WhatsApp MOSSANO" />
            {/* A real navigation, not a scripted download: the PDF is served by
                the API and must open even in a WhatsApp in-app browser. */}
            <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-light">
              <Download className="h-4 w-4" strokeWidth={1.25} aria-hidden="true" />
              Download as PDF
            </a>
          </div>
        </div>
      </Section>

      <Section>
        {data.stones.length ? (
          /**
           * Phase-1 feedback §8 — one row per stone rather than a full-width
           * section each. A customer comparing a shortlist wants the lots beside
           * each other; the previous alternating layout put a screen of scroll
           * between lot one and lot two, which is the opposite of a comparison.
           */
          <div className="divide-y divide-ivory-dark border-y border-ivory-dark">
            {data.stones.map((stone, i) => (
              <article
                key={stone.id}
                className="grid gap-6 py-10 sm:grid-cols-[minmax(0,240px)_1fr] sm:gap-10"
              >
                <Slab
                  media={stone.images[0] ?? stone.primaryImage}
                  url={stone.primaryImageUrl}
                  alt={`${stone.name} — natural stone slab`}
                  aspect="landscape"
                  priority={i === 0}
                  sizes="(min-width: 640px) 240px, 100vw"
                />

                <div className="min-w-0">
                  <p className="label">
                    {String(i + 1).padStart(2, "0")} · {stone.mossanoCode}
                  </p>
                  <h2 className="mt-1.5 font-display text-[1.25rem] uppercase leading-tight tracking-wide">
                    {stone.name}
                  </h2>

                  <AvailabilityBadge
                    className="mt-3"
                    availability={stone.availability}
                    label={stone.availabilityLabel}
                    verifiedLabel={stone.verifiedLabel}
                    isVerifiedLot={stone.isVerifiedLot}
                  />

                  {stone.selectionNote && (
                    <p className="mt-5 border-l border-brass pl-5 text-[0.95rem] leading-relaxed text-ink-soft">
                      {stone.selectionNote}
                    </p>
                  )}

                  {/* Two columns of specs keep the row shallow — the whole
                      point of the change is that the next lot stays in view. */}
                  <dl className="mt-6 grid gap-x-12 sm:grid-cols-2">
                    {stone.specs.map((spec) => (
                      <div key={spec.label} className="spec">
                        <dt>{spec.label}</dt>
                        <dd className={cn(spec.value === "On request" && "text-ink-faint")}>
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-6 flex flex-wrap items-center gap-6">
                    <Link to={stone.href} className="btn-outline">
                      Full details
                    </Link>
                    <FavouriteButton slug={stone.slug} name={stone.name} withLabel />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="This selection is being prepared"
            body="MOSSANO is still adding stones to it."
          />
        )}
      </Section>

      <Section tone="deep">
        <div className="max-w-3xl">
          <SectionHeading
            label="Next"
            title="Request a Reservation, or Ask for More"
            intro="MOSSANO can hold a lot, send more photography, or add alternatives to this selection."
          />

          {enquiring ? (
            <EnquiryForm
              className="mt-10"
              type="selection"
              selectionToken={token}
              subject={data.title}
              requirementLabel="What do you need"
              submitLabel="Send to MOSSANO"
            />
          ) : (
            <div className="mt-10 flex flex-wrap gap-4">
              <button type="button" onClick={() => setEnquiring(true)} className="btn-solid">
                Request reservation
              </button>
              <button type="button" onClick={() => setEnquiring(true)} className="btn-outline">
                Ask for more information
              </button>
              <WhatsAppButton href={data.whatsapp} variant="outline" />
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
