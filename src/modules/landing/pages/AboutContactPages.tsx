import { Link } from "react-router-dom";
import { Section, SectionHeading, EmptyState } from "@/shared/components/Section";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { EnquiryForm } from "@/modules/enquiry/components/EnquiryForm";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import type { BrandLocation } from "@/shared/api/types";

/** "Mumbai, Maharashtra 400003" — and just "Dubai" where the rest is absent. */
const cityLine = ({ city, state, postalCode }: BrandLocation) =>
  [[city, state].filter(Boolean).join(", "), postalCode].filter(Boolean).join(" ");

/**
 * Website §10 — About MOSSANO.
 *
 * The five headings the document asks for: story, sourcing experience, global
 * network, curation approach, quality and service. The copy is deliberately
 * short and declarative, and it claims nothing the client has not stated —
 * there is no founding date, no project count and no client list here, because
 * none of those has been supplied. See docs/CLIENT-QUESTIONS.md.
 */
const PILLARS = [
  {
    title: "Sourcing experience",
    body: "Over twelve years buying marble, granite and natural stone, working from Mumbai and Dubai and from the quarries themselves.",
  },
  {
    title: "Global network",
    body: "Relationships with quarries and processors across several countries, which is what makes it possible to find a specific block rather than sell what happens to be in the yard.",
  },
  {
    title: "Curation",
    body: "Most stone is ordinary. MOSSANO's work is deciding what is not, and putting only that in front of a designer.",
  },
  {
    title: "Quality and service",
    body: "Every lot is photographed as it actually is and its availability is verified, so what you specify is what arrives.",
  },
];

export function AboutPage() {
  const { brand, whatsapp } = useSiteConfig();

  return (
    <>
      <Section tone="dark" className="pt-28">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4 text-ivory/55">About</p>
          <h1 className="h-display mt-2 text-ivory">{brand.strapline}</h1>
          <p className="mt-8 max-w-prose text-[1rem] leading-relaxed text-ivory/75">
            MOSSANO MARMO sources natural stone for architects, designers and developers who need a
            specific thing rather than a category. The business runs out of Mumbai and Dubai, and
            the work is as much about knowing what to leave out as what to bring in.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHeading label="How MOSSANO works" title="Four Things That Matter" />
        <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="border-t border-ivory-dark pt-6">
              <h2 className="font-display text-[1rem] uppercase tracking-wide">{pillar.title}</h2>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">{pillar.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="deep">
        <div className="max-w-2xl">
          <SectionHeading
            label="Start here"
            title="Tell MOSSANO What You Need"
            intro="A message with the material, the quantity and the date is enough to begin."
          />
          <div className="mt-10 flex flex-wrap gap-4">
            <WhatsAppButton href={whatsapp.general} />
            <Link to="/private-sourcing" className="btn-outline">
              Private Sourcing
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
