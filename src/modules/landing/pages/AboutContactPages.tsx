import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicQueries } from "@/shared/api/publicQueries";
import { Section, SectionHeading, EmptyState } from "@/shared/components/Section";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { EnquiryForm } from "@/modules/enquiry/components/EnquiryForm";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { Flag } from "@/shared/components/Flag";
import type { BrandLocation } from "@/shared/api/types";

/** "Mumbai, Maharashtra 400003" — and just "Dubai" where the rest is absent. */
const cityLine = ({ city, state, postalCode }: BrandLocation) =>
  [[city, state].filter(Boolean).join(", "), postalCode].filter(Boolean).join(" ");

/**
 * Website §10 — About MOSSANO — rebuilt from the client's own brochure
 * (`Mossano Marmo.pdf`, 9 Sep 2026) after Phase-1 feedback §5 asked for three
 * more sections plus a process section.
 *
 * Every figure and phrase below is transcribed from that document. Nothing is
 * rounded up, softened or embellished: an architect who reads "6,000+ tons
 * annually" here and hears something different on a call stops believing the
 * rest of the page. See CLIENT-FACTS.md.
 */
const STATS = [
  { figure: "12+", label: "Years of experience", note: "In the natural stone industry" },
  { figure: "30,000+", label: "Sq. ft.", note: "State-of-the-art manufacturing unit" },
  { figure: "6,000+", label: "Tons annually", note: "Imported premium white marble" },
  { figure: "Global", label: "Presence", note: "Strong networks across the world" },
];

/** The brochure's "About Mossano Marmo" six. */
const CAPABILITIES = [
  "Global Sourcing",
  "Exclusive Collections",
  "Factory Direct Procurement",
  "Premium Quality Inspection",
  "Pan India Supply",
  "Project Support",
];

/**
 * The brochure's "Why Choose Mossano Marmo" six, in its own words.
 *
 * Phase-3 feedback ran these as a carousel on the home page and then asked for
 * it removed, so they are back to living here — read, not scrolled past.
 */
const REASONS = [
  { title: "Direct Factory Sourcing", body: "Better pricing, no middlemen." },
  { title: "Custom Selection", body: "Unique slabs for every project." },
  { title: "Quality Inspection", body: "Premium selection at source." },
  { title: "Designer Support", body: "Material consultation expertise." },
  { title: "Global Network", body: "Exclusive materials worldwide." },
  { title: "Project Handling", body: "Bulk supply capability." },
];

/**
 * Phase-1 feedback §5's "Our Process / Journey".
 *
 * Sequenced from what the brochure states — the six capabilities, the source
 * countries and "from quarry to site, delivering consistent quality standards
 * and reliable timelines" — rather than invented. The last step is the one thing
 * this site adds that the brochure cannot: availability that is verified rather
 * than asserted.
 */
const JOURNEY = [
  {
    n: "01",
    title: "Sourced at the quarry",
    body: "Direct relationships with factories across Italy, Turkey, Greece, Brazil, Vietnam and China — exclusive and rare stone, bought without middlemen.",
  },
  {
    n: "02",
    title: "Inspected at source",
    body: "Premium selection happens before anything ships, not after it arrives. What fails inspection never becomes your problem.",
  },
  {
    n: "03",
    title: "Held and processed",
    body: "A 30,000 sq ft manufacturing unit and around 6,000 tons of premium white marble imported a year, so a large order is a stock question rather than a search.",
  },
  {
    n: "04",
    title: "Curated for the project",
    body: "Most stone is ordinary. The work is deciding what is not, and putting only that in front of a designer.",
  },
  {
    n: "05",
    title: "Verified, then delivered",
    body: "Every lot here is photographed as it actually is and its availability is verified, so what you specify is what arrives — anywhere in India, and to Dubai.",
  },
];

export function AboutPage() {
  const { whatsapp } = useSiteConfig();
  // The same list the home page's flag row uses — the countries the catalogue
  // actually holds stock from. Shared query, so this costs no extra request.
  const { data: home } = useQuery(publicQueries.home());
  const sourceCountries = home?.sourceCountries ?? [];

  return (
    <>
      <Section tone="dark" className="pt-28">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4 text-ivory/55">About us</p>
          <h1 className="h-display mt-2 text-ivory">Crafting Timeless Legacies in Stone</h1>
          <p className="mt-8 max-w-prose text-[1rem] leading-relaxed text-ivory/75">
            MOSSANO MARMO is a premium marble sourcing and distribution company, offering the
            world&rsquo;s finest natural stones for luxury spaces. With a commitment to quality,
            innovation and service, we transform raw beauty into timeless experiences.
          </p>
        </div>

        <dl className="mt-16 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="border-t border-ivory/20 pt-6">
              <dt className="font-display text-[2rem] leading-none text-brass-light">
                {stat.figure}
              </dt>
              <dd className="mt-3">
                <span className="font-display text-[0.95rem] uppercase tracking-wide text-ivory">
                  {stat.label}
                </span>
                <span className="mt-1.5 block text-[0.85rem] leading-relaxed text-ivory/60">
                  {stat.note}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <SectionHeading
          label="About MOSSANO MARMO"
          title="India's Premium Marble Sourcing &amp; Luxury Surface Company"
        />
        <ul className="mt-14 grid gap-x-12 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <li
              key={capability}
              className="border-t border-ivory-dark pt-5 font-display text-[1rem] uppercase tracking-wide"
            >
              {capability}
            </li>
          ))}
        </ul>
        <p className="mt-12 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
          Strong relationships with international factories allow us to deliver exclusive and rare
          natural stones.
        </p>
        {/* Phase-3 feedback — flags, not names, and taken from the catalogue
            rather than listed here. */}
        {sourceCountries.length > 0 && (
          <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            {sourceCountries.map((country) => (
              <li key={country.code} className="text-[1.7rem] leading-none">
                <Flag code={country.code} label={country.label} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section tone="deep">
        <SectionHeading label="Why choose us" title="We Curate Experiences in Stone" />
        <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <div key={reason.title} className="border-t border-ivory-dark pt-6">
              <h2 className="font-display text-[1rem] uppercase tracking-wide">{reason.title}</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{reason.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-14 max-w-prose border-l border-brass pl-6 font-display text-[1.15rem] leading-relaxed">
          We don&rsquo;t just supply marble. We curate experiences in stone.
        </p>
      </Section>

      <Section>
        <SectionHeading
          label="Our process"
          title="From Rare Quarries to Refined Spaces"
          intro="Where nature meets luxury — what happens between a block in a quarry and a finished surface in your project."
        />
        <ol className="mt-14 space-y-10">
          {JOURNEY.map((step) => (
            <li
              key={step.n}
              className="grid gap-x-8 gap-y-3 border-t border-ivory-dark pt-6 sm:grid-cols-[auto_1fr]"
            >
              <p className="font-display text-[1.5rem] leading-none text-brass">{step.n}</p>
              <div>
                <h2 className="font-display text-[1rem] uppercase tracking-wide">{step.title}</h2>
                <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="dark">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4 text-ivory/55">Founder</p>
          <h2 className="h-section mt-2 text-ivory">Sayed Mohsin</h2>
          <p className="mt-6 max-w-prose text-[1rem] leading-relaxed text-ivory/75">
            MOSSANO MARMO is a founder-led business, and the buying decisions are made by someone
            who has been in the natural stone trade for over twelve years. That is what a direct
            relationship with a quarry actually rests on.
          </p>
        </div>
      </Section>

      <Section tone="deep">
        <div className="max-w-2xl">
          <SectionHeading
            label="Start here"
            title="Let's Create Something Timeless"
            intro="A message with the material, the quantity and the date is enough to begin."
          />
          <div className="mt-10 flex flex-wrap gap-4">
            <WhatsAppButton href={whatsapp.general} />
            <Link to="/private-sourcing" className="btn-outline">
              Personalize Sourcing
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}

/** Website §11 — Contact. WhatsApp, phone, email, and a simple form. */
export function ContactPage() {
  const { brand, whatsapp } = useSiteConfig();

  return (
    <Section className="pt-24 sm:pt-28">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
        <div>
          <div className="rule" />
          <p className="label mt-4">Contact</p>
          <h1 className="h-display mt-2">Talk to MOSSANO</h1>

          <div className="mt-10 space-y-8">
            <div>
              <p className="label">WhatsApp</p>
              <WhatsAppButton href={whatsapp.general} variant="quiet" className="mt-2" />
            </div>

            <div>
              <p className="label">Telephone</p>
              <div className="mt-2 space-y-1">
                {brand.phones.map((phone) => (
                  <p key={phone}>
                    <a
                      href={`tel:+91${phone}`}
                      className="inline-block py-1 text-[0.95rem] transition-colors hover:text-brass"
                    >
                      +91 {phone}
                    </a>
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="label">Email</p>
              <p className="mt-2">
                <a
                  href={`mailto:${brand.email}`}
                  className="inline-block py-1 text-[0.95rem] transition-colors hover:text-brass"
                >
                  {brand.email}
                </a>
              </p>
            </div>

            <div>
              <p className="label">Visit</p>
              <div className="mt-2 space-y-5">
                {brand.locations.map((location) => (
                  <address
                    key={location.label}
                    className="space-y-0.5 not-italic text-[0.95rem] leading-relaxed text-ink-soft"
                  >
                    <p className="font-display uppercase tracking-wide text-ink">
                      {location.label}
                    </p>
                    <p>{location.line1}</p>
                    <p>{location.line2}</p>
                    {/* Dubai is printed without a state or postcode, so the
                        line is assembled rather than templated. */}
                    <p>{cityLine(location)}</p>
                    <p>{location.country}</p>
                  </address>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionHeading label="Or write" title="Send an Enquiry" />
          <EnquiryForm className="mt-10" type="general" />
        </div>
      </div>
    </Section>
  );
}

export function NotFoundPage() {
  return (
    <Section className="pt-28">
      <EmptyState
        title="Page not found"
        body="The link may be out of date, or the stone may have been withdrawn."
        action={
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/shop" className="btn-solid">
              Browse the Stone Shop
            </Link>
            <Link to="/" className="btn-outline">
              Home
            </Link>
          </div>
        }
      />
    </Section>
  );
}
