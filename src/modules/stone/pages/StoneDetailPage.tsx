import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { publicQueries } from "@/shared/api/publicQueries";
import {
  Section,
  SectionHeading,
  EmptyState,
} from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { Slab } from "@/shared/components/Slab";
import { AvailabilityBadge } from "@/shared/components/AvailabilityBadge";
import { FavouriteButton } from "@/shared/components/FavouriteButton";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { EnquiryForm } from "@/modules/enquiry/components/EnquiryForm";
import { cn } from "@/shared/lib/cn";

/**
 * Website §4.
 *
 * The page the whole site exists to deliver a customer to, and the one the
 * brief cares most about previewing correctly: it is what gets forwarded on
 * WhatsApp. It is server-rendered with its real content, so a crawler that runs
 * no JavaScript still sees the name, the code, the availability and the image.
 */
export function StoneDetailPage() {
  const { slug = "" } = useParams();
  const { data, isError } = useQuery(publicQueries.stone(slug));
  const [active, setActive] = useState(0);
  const [enquiryType, setEnquiryType] = useState<
    "reserve" | "slab_video" | "stone" | null
  >(null);

  if (isError) {
    return (
      <Section>
        <EmptyState
          title="Stone not found"
          body="This lot may have been withdrawn."
          action={
            <Link to="/shop" className="btn-outline">
              Browse the Stone Shop
            </Link>
          }
        />
      </Section>
    );
  }

  if (!data)
    return (
      <Section>
        <div className="h-96" />
      </Section>
    );

  const { stone, related, appearsIn, projects } = data;
  const gallery = stone.images.length ? stone.images : [];
  const current = gallery[active] ?? stone.primaryImage;

  return (
    <>
      <Section className="pt-24 sm:pt-28">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          {/* ── Photography ───────────────────────────────────────────── */}
          <div>
            <Slab
              media={current}
              url={stone.primaryImageUrl}
              alt={`${stone.name} — natural stone slab`}
              aspect="landscape"
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
            />

            {gallery.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {gallery.map((image, i) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`View image ${i + 1} of ${gallery.length}`}
                    aria-current={i === active}
                    className={cn(
                      "slab-frame aspect-square transition-opacity",
                      i === active
                        ? "opacity-100 ring-1 ring-brass"
                        : "opacity-60 hover:opacity-100",
                    )}
                  >
                    <img src={image.thumbnailUrl} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Website §4 — "individual slab images where available". Shown
                only when the team has actually photographed the lot piece by
                piece, which is the whole value of the section. */}
            {stone.slabs.length > 0 && (
              <div className="mt-14">
                <p className="label">The lot, slab by slab</p>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {stone.slabs.map((slab) => (
                    <figure key={slab.id}>
                      <Slab
                        media={slab.image}
                        alt={`${stone.name}${slab.reference ? ` — slab ${slab.reference}` : ""}`}
                        aspect="portrait"
                        sizes="(min-width: 640px) 20vw, 45vw"
                        className={cn(slab.isSold && "opacity-45")}
                      />
                      <figcaption className="mt-2 flex items-baseline justify-between gap-2">
                        <span className="label">
                          {slab.reference ?? "Slab"}
                        </span>
                        {slab.lengthIn && slab.widthIn && (
                          <span className="text-[0.72rem] text-ink-faint">
                            {slab.lengthIn} × {slab.widthIn} in
                          </span>
                        )}
                        {slab.isSold && <span className="label">Sold</span>}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── The facts ─────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rule" />
            <p className="label mt-4">{stone.mossanoCode}</p>
            <h1 className="h-display mt-2">{stone.name}</h1>

            <AvailabilityBadge
              className="mt-5"
              availability={stone.availability}
              label={stone.availabilityLabel}
              verifiedLabel={stone.verifiedLabel}
              isVerifiedLot={stone.isVerifiedLot}
            />

            {stone.description && (
              <p className="mt-7 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
                {stone.description}
              </p>
            )}

            {/* Every spec, "On request" included. The server resolved these —
                an absent origin is a fact about the listing, not a gap to hide.
                See docs/CLIENT-QUESTIONS.md. */}
            <dl className="mt-9">
              {stone.specs.map((spec) => (
                <div key={spec.label} className="spec">
                  <dt>{spec.label}</dt>
                  <dd
                    className={cn(
                      spec.value === "On request" && "text-ink-faint",
                    )}
                  >
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>

            {(stone.looks.length > 0 || stone.applications.length > 0) && (
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
                {stone.looks.map((look) => (
                  <Link
                    key={look.slug}
                    to={`/look/${look.slug}`}
                    className="label underline-offset-4 transition-colors hover:text-brass hover:underline"
                  >
                    {look.label}
                  </Link>
                ))}
                {stone.applications.map((app) => (
                  <Link
                    key={app.slug}
                    to={`/application/${app.slug}`}
                    className="label underline-offset-4 transition-colors hover:text-brass hover:underline"
                  >
                    {app.label}
                  </Link>
                ))}
              </div>
            )}

            {/* ── Website §4's four customer actions ─────────────────── */}
            <div className="mt-10 space-y-3">
              {stone.isReservable ? (
                <button
                  type="button"
                  onClick={() => setEnquiryType("reserve")}
                  className="btn-solid w-full"
                >
                  Reserve this lot
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEnquiryType("stone")}
                  className="btn-outline w-full"
                >
                  Enquire about this lot
                </button>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setEnquiryType("slab_video")}
                  className="btn-outline"
                >
                  Request slab video
                </button>
                <FavouriteButton
                  slug={stone.slug}
                  name={stone.name}
                  withLabel
                  className="btn-outline justify-center"
                />
              </div>

              {/* A plain anchor with the message already composed, so it works
                  with JavaScript off — Admin Scope §8. */}
              <WhatsAppButton
                href={stone.whatsapp.enquire}
                className="w-full"
              />
            </div>

            {appearsIn.length > 0 && (
              <p className="mt-8 text-[0.8rem] text-ink-faint">
                In{" "}
                {appearsIn.map((edit, i) => (
                  <span key={edit.href}>
                    {i > 0 && ", "}
                    <Link
                      to={edit.href}
                      className="text-ink-soft underline-offset-4 hover:underline"
                    >
                      {edit.title}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ── The enquiry, inline rather than in a modal ────────────────────
          A dialog would trap the customer away from the specs they are asking
          about, and on a phone it covers the photograph entirely. */}
      {enquiryType && (
        <Section tone="deep" id="enquire">
          <div className="max-w-3xl">
            <SectionHeading
              label={
                enquiryType === "reserve"
                  ? "Reserve"
                  : enquiryType === "slab_video"
                    ? "Slab video"
                    : "Enquiry"
              }
              title={
                enquiryType === "reserve"
                  ? "Reserve This Lot"
                  : enquiryType === "slab_video"
                    ? "Request the Actual Slab Video"
                    : "Enquire About This Lot"
              }
            />
            <EnquiryForm
              className="mt-10"
              type={enquiryType}
              stoneSlug={stone.slug}
              subject={`${stone.mossanoCode} ${stone.name}`}
              requirementLabel={
                enquiryType === "reserve" ? "Quantity required" : undefined
              }
              submitLabel={
                enquiryType === "reserve" ? "Request reservation" : "Send"
              }
            />
          </div>
        </Section>
      )}

      {projects.length > 0 && (
        <Section>
          <SectionHeading
            label="In place"
            title="Where This Stone Has Been Used"
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} to={project.href} className="group block">
                <Slab
                  media={project.coverImage}
                  alt={project.title}
                  aspect="landscape"
                  sizes="(min-width: 1024px) 30vw, 45vw"
                />
                <p className="label mt-3">{project.applicationLabel}</p>
                <h3 className="mt-1 font-display text-[0.95rem] uppercase tracking-wide">
                  {project.projectName ?? project.title}
                </h3>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section tone="deep">
          <SectionHeading label="Also consider" title="Similar Stone" />
          <div className="mt-12">
            <StoneGrid stones={related.slice(0, 3)} priorityCount={0} />
          </div>
        </Section>
      )}
    </>
  );
}
