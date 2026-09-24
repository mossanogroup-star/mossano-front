import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { publicQueries } from "@/shared/api/publicQueries";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { Section, SectionHeading, EmptyState } from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { Slab } from "@/shared/components/Slab";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { PartnerMarquee } from "../components/PartnerMarquee";
import { RunningNumbers } from "../components/RunningNumbers";
import { HeroSlider } from "../components/HeroSlider";
import { WhyMossano } from "../components/WhyMossano";
import { CountryFlags } from "@/shared/components/CountryFlags";

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
  const { data: clientCategories } = useQuery(publicQueries.clients());
  const { brand, whatsapp } = useSiteConfig();

  // §2 asks for every logo in one strip, so the categories are flattened here.
  // The Clients page renders the same query grouped.
  const allClients = (clientCategories ?? []).flatMap((category) => category.clients);

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
      {/* ── Hero — Phase-3 feedback ──────────────────────────────────────────
          Two slides: the black slab under the wordmark, then "Why MOSSANO" as
          the client's reference image. The slab is the measured hero (see
          resolveHero and `npm run measure:hero`) — the darkest lot in the
          catalogue, and the only one ivory type reads cleanly over. */}
      <HeroSlider
        slides={[
          {
            key: "hero",
            label: brand.name,
            content: (
              <div className="relative flex flex-1 flex-col justify-center pb-20 max-sm:tiny:pb-14 sm:pb-24">
                <Slab
                  media={hero}
                  url={heroUrl}
                  alt={hero?.alt || data?.hero?.stone.name || ""}
                  aspect="auto"
                  priority
                  sizes="100vw"
                  className="absolute inset-0 h-full w-full"
                  imgClassName="h-full w-full object-cover"
                />
                {/* Text sits on the stone, so the slab is darkened rather than
                    the type being given a box — DESIGN.md's rule. */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-umber-deep/90 via-umber-deep/45 to-transparent"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-l from-umber-deep/75 via-umber-deep/10 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-umber-deep/20" aria-hidden="true" />
                <div
                  className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-umber-deep/85 to-transparent"
                  aria-hidden="true"
                />

                {/**
                 * One screen on every device — Phase-3 feedback.
                 *
                 * The spacing steps up rather than down: a phone gets the tight
                 * version, a laptop the roomy one. `svh` not `vh`, because on iOS `vh`
                 * is the height with the browser chrome *hidden*, so a 78vh hero plus
                 * a 64px header overflowed the visible window on arrival and pushed
                 * the wordmark under the header.
                 */}
                <div className="shell relative flex flex-col justify-center pb-4 pt-6 max-sm:tiny:pb-2 max-sm:tiny:pt-3 sm:pb-6 sm:pt-24">
                  {/* The running numbers sit opposite the wordmark on a laptop,
                      and stacked beneath it on a phone — Phase-3 feedback, the
                      client wanted them read down, not across. Kept tight so
                      the whole slide still fits an iPhone SE. */}
                  <div className="grid gap-5 max-sm:tiny:gap-3.5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end lg:gap-16">
                    <div className="max-w-2xl">
                      <div className="rule max-sm:tiny:hidden" />
                      <h1 className="h-display mt-3 text-[1.4rem] max-sm:tiny:mt-0 text-ivory sm:mt-6 sm:text-[2rem] lg:text-[2.6rem]">
                        {brand.name}
                      </h1>
                      <p className="mt-2.5 max-w-md text-[0.85rem] max-sm:tiny:mt-1.5 leading-relaxed text-ivory/80 sm:mt-5 sm:text-[1rem]">
                        {brand.tagline}
                      </p>
                      {/* Phase-1 feedback §1 — a short message in the first section. The
                client's own line, from the brochure. */}
                      <p className="mt-2.5 max-w-md font-display max-sm:tiny:mt-1.5 text-[0.82rem] leading-relaxed text-brass-light sm:mt-4 sm:text-[0.95rem]">
                        We don&rsquo;t just supply marble. We curate experiences in stone.
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 max-sm:tiny:mt-3 max-sm:tiny:gap-y-2 sm:mt-10 sm:gap-4">
                        <Link to="/new-edit" className="btn-light max-sm:tiny:py-2.5">
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

                    <RunningNumbers
                      tone="light"
                      className="grid max-w-[18rem] gap-2.5 max-sm:tiny:gap-1.5 sm:gap-4 lg:block lg:max-w-none lg:space-y-6"
                    />
                  </div>
                </div>
              </div>
            ),
          },
          ...(data?.process?.length
            ? [{ key: "why", label: "Why MOSSANO", content: <WhyMossano steps={data.process} /> }]
            : []),
        ]}
      />

      {/* ── Clients — Phase-1 feedback §1, Phase-2 feedback §2 ───────────────
          Every logo in one moving strip. The roster is CRM-managed; the
          Clients page shows the same clients grouped, and still. */}
      {allClients.length > 0 && (
        <Section className="py-14">
          <p className="label text-center">Trusted by visionaries. Chosen by industry leaders.</p>
          <div className="mt-8">
            <PartnerMarquee clients={allClients} />
          </div>
          <p className="mt-8 text-center">
            <Link
              to="/clients"
              className="label underline-offset-4 transition-colors hover:text-brass hover:underline"
            >
              All clients
            </Link>
          </p>
        </Section>
      )}

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
            <CountryFlags />
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
            {/* Phase-3 feedback — all six factory countries, as in the section
                above. Read from stock it showed Italy alone. */}
            <CountryFlags />

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
