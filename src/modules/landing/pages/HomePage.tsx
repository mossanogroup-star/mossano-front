import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { publicQueries } from "@/shared/api/publicQueries";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { Section, SectionHeading, EmptyState } from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { Slab } from "@/shared/components/Slab";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { PartnerMarquee } from "../components/PartnerMarquee";

/**
 * Website §1.
 *
 * "Luxury hero image / MOSSANO MARMO / Curated Natural Stone. Sourced Globally.
 * / Explore New Edit / Private Sourcing / Featured stones / Shop by Look /
 * Shop by Application / About MOSSANO / WhatsApp CTA" — in that order, because
 * the order is the customer journey the document then spells out.
 */
export function HomePage() {
  const { data } = useQuery(publicQueries.home());
  const { brand, whatsapp } = useSiteConfig();

  /**
   * Resolved on the server — see publicService.resolveHero.
   *
   * It used to be `currentEdit?.coverImage ?? featured[0]?.primaryImage`, which
   * meant nobody chose it: with the Edit unpublished it fell to whichever
   * featured stone happened to sort first, and that order moves with
   * availability. Marking a lot Available changed the front page; a lot
   * *selling* changed it too.
   */
  const hero = data?.hero?.image ?? null;
  const heroUrl = hero?.url ?? data?.hero?.stone.primaryImageUrl ?? null;

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────────
          Text sits on the stone, so the slab is darkened by a gradient rather
          than the type being given a box. DESIGN.md's rule is that the stone is
          the content; a legibility panel over it is interface competing with
          product. The gradient is weighted to the bottom-left, where the type
          actually is, so the slab's figure stays readable. */}
      <section className="relative isolate min-h-[78vh] short:min-h-[92vh] overflow-hidden bg-umber-deep">
        <Slab
          media={hero}
          url={heroUrl}
          alt=""
          aspect="auto"
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full"
          imgClassName="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-tr from-umber-deep/90 via-umber-deep/45 to-transparent"
          aria-hidden="true"
        />

        <div className="shell relative flex min-h-[78vh] short:min-h-[92vh] flex-col justify-end pb-16 pt-28 sm:pb-24">
          <div className="max-w-2xl">
            <div className="rule" />
            <h1 className="h-display mt-6 text-ivory">{brand.name}</h1>
            <p className="mt-5 max-w-md text-[1rem] leading-relaxed text-ivory/80">
              {brand.tagline}
            </p>
            {/* Phase-1 feedback §1 — a short message in the first section. The
                client's own line, from the brochure. */}
            <p className="mt-4 max-w-md font-display text-[0.95rem] leading-relaxed text-brass-light">
              We don&rsquo;t just supply marble. We curate experiences in stone.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/new-edit" className="btn-light">
                Explore New Edit
              </Link>
              <Link
                to="/private-sourcing"
                className="border-b border-ivory/35 py-1.5 font-sans text-[0.66rem] uppercase tracking-label text-ivory/80 transition-colors hover:border-ivory hover:text-ivory"
              >
                MOSSANO Sourcing Desk
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Clients & partners — Phase-1 feedback §1 ─────────────────────── */}
      <Section className="py-14">
        <p className="label text-center">Trusted by visionaries. Chosen by industry leaders.</p>
        <PartnerMarquee />
      </Section>

      {/* ── Who MOSSANO is ───────────────────────────────────────────────────
          Phase-1 feedback §1 asked for the footer write-up to become a proper
          section here. It was one line under the wordmark; this is the client's
          own positioning statement from the brochure, which is what that line
          was standing in for. */}
      <Section tone="dark">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <div className="rule" />
            <h2 className="h-section mt-5 text-ivory">{brand.strapline}</h2>
          </div>
          <div>
            <p className="max-w-prose text-[1rem] leading-relaxed text-ivory/75">
              MOSSANO MARMO is a premium marble sourcing and distribution company, offering the
              world&rsquo;s finest natural stones for luxury spaces. Strong relationships with
              international factories across Italy, Turkey, Greece, Brazil, Vietnam and China let us
              deliver exclusive and rare natural stone — with every lot photographed as it actually
              is, and its availability verified before you specify it.
            </p>
            <Link
              to="/about"
              className="label mt-8 inline-block border-b border-ivory/35 py-1.5 text-ivory/80 transition-colors hover:border-ivory hover:text-ivory"
            >
              About MOSSANO
            </Link>
          </div>
        </div>
      </Section>

      {/* ── The Current Edit ─────────────────────────────────────────────── */}
      {data?.currentEdit && (
        <Section tone="deep">
          <SectionHeading
            label={data.currentEdit.statusLabel}
            title={data.currentEdit.title}
            intro={data.currentEdit.subtitle || undefined}
            action={{ to: "/new-edit", label: "View the Edit" }}
          />
          <div className="mt-14">
            {data.currentEdit.stones?.length ? (
              <StoneGrid stones={data.currentEdit.stones.slice(0, 6)} />
            ) : (
              <EmptyState
                title="This Edit is being curated"
                body="The stones for this month are being verified before they are published."
              />
            )}
          </div>
        </Section>
      )}

      {/* ── Featured stones ──────────────────────────────────────────────── */}
      <Section>
        <SectionHeading
          label={data?.isFeaturedFallback ? "Recently added" : "Featured"}
          title={data?.isFeaturedFallback ? "Recently Added Stone" : "Featured Stone"}
          action={{ to: "/shop", label: "All stone" }}
        />
        <div className="mt-14">
          {data?.featured.length ? (
            <StoneGrid stones={data.featured.slice(0, 6)} priorityCount={0} />
          ) : (
            <EmptyState
              title="The catalogue is being prepared"
              body="MOSSANO's stock is being photographed and verified."
              action={<WhatsAppButton href={whatsapp.general} label="Ask what is in stock" />}
            />
          )}
        </div>
      </Section>

      {/* ── Shop by Look (Website §6) ────────────────────────────────────── */}
      <Section tone="deep">
        <SectionHeading
          label="Shop by Look"
          title="Find the Mood First"
          intro="Most projects begin with a feeling rather than a material. Start there."
          action={{ to: "/look", label: "All looks" }}
        />
        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
          {(data?.looks ?? [])
            // A look with nothing tagged to it would open an empty listing,
            // which reads as a broken site rather than an empty category.
            .filter((look) => !look.isEmpty)
            .map((look) => (
              <Link key={look.slug} to={look.href} className="group block">
                <Slab
                  url={look.image}
                  alt={look.imageAlt ?? look.label}
                  aspect="square"
                  sizes="(min-width: 1024px) 30vw, 45vw"
                />
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-[0.95rem] uppercase tracking-wide">
                    {look.label}
                  </h3>
                  <span className="label tabular-nums">{look.count}</span>
                </div>
              </Link>
            ))}
        </div>
      </Section>

      {/* ── Shop by Application (Website §7) ─────────────────────────────── */}
      <Section>
        <SectionHeading
          label="Shop by Application"
          title="Stone in Place"
          action={{ to: "/application", label: "All applications" }}
        />
        <ul className="mt-12 grid gap-x-8 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.applications ?? []).map((application) => (
            <li key={application.slug} className="border-b border-ivory-dark">
              {application.isEmpty ? (
                // Stated rather than linked. The client has supplied no
                // application photography yet, and a link to nothing is worse
                // than an honest "not yet".
                <span className="flex items-baseline justify-between gap-4 py-5 text-[0.95rem] text-ink-faint">
                  {application.label}
                  <span className="label">Coming soon</span>
                </span>
              ) : (
                <Link
                  to={application.href}
                  className="flex items-baseline justify-between gap-4 py-5 text-[0.95rem] transition-colors hover:text-brass"
                >
                  {application.label}
                  <span className="label tabular-nums">
                    {application.projectCount || application.stoneCount}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── About + WhatsApp ─────────────────────────────────────────────── */}
      <Section tone="dark">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
          <div>
            <SectionHeading
              label="About"
              title="Curators of Exceptional Natural Stone"
              tone="light"
            />
            <p className="mt-8 max-w-prose text-[0.95rem] leading-relaxed text-ivory/70">
              MOSSANO MARMO sources marble, granite and natural stone from quarries worldwide and
              curates what is worth specifying. Every lot is photographed as it actually is, and its
              availability is verified rather than assumed.
            </p>
            <Link to="/about" className="btn-light mt-10">
              About MOSSANO
            </Link>
          </div>

          <div className="lg:pl-12 lg:border-l lg:border-ivory/15">
            <div className="rule" />
            <p className="label mt-4 text-ivory/55">Talk to us</p>
            <h2 className="h-section mt-2 text-ivory">A Message Is Faster</h2>
            <p className="mt-6 max-w-prose text-[0.95rem] leading-relaxed text-ivory/70">
              Send a requirement on WhatsApp and MOSSANO will come back with actual slab photography
              and what is available now.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <WhatsAppButton href={whatsapp.general} />
              <Link to="/private-sourcing" className="btn-light">
                Personalize Sourcing
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
