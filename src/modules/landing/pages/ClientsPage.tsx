import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Section, SectionHeading, EmptyState } from "@/shared/components/Section";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { publicQueries } from "@/shared/api/publicQueries";
import { ClientLogo } from "../components/ClientLogo";

/**
 * Phase-2 feedback §1 — the Clients page.
 *
 * Explicitly not a carousel: the client asked for the logos shown properly under
 * their categories, and they are right. A carousel here would hide most of the
 * roster behind a timer, on the one page whose entire job is to show how much of
 * it there is. The moving version belongs on the home page, where it is a
 * teaser — see PartnerMarquee.
 *
 * Categories and logos are CRM-managed; nothing about them is in this file.
 */
export function ClientsPage() {
  const { data: categories } = useQuery(publicQueries.clients());
  const { whatsapp } = useSiteConfig();

  const total = (categories ?? []).reduce((sum, c) => sum + c.clients.length, 0);

  return (
    <>
      <Section tone="dark" className="pt-28">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4 text-ivory/55">Our clients</p>
          <h1 className="h-display mt-2 text-ivory">
            Trusted by Visionaries. Chosen by Industry Leaders.
          </h1>
          <p className="mt-8 max-w-prose text-[1rem] leading-relaxed text-ivory/75">
            MOSSANO collaborates with leading architects, interior designers, developers and luxury
            brands who share a commitment to exceptional craftsmanship and timeless design.
          </p>
        </div>
      </Section>

      {total === 0 ? (
        <Section>
          <EmptyState
            title="Client list is being prepared"
            body="MOSSANO is adding its clients and partners to this page."
            action={<WhatsAppButton href={whatsapp.general} />}
          />
        </Section>
      ) : (
        (categories ?? []).map((category, i) => (
          <Section key={category.id} tone={i % 2 === 1 ? "deep" : undefined}>
            <SectionHeading
              label="Clients"
              title={category.name}
              intro={`${category.clients.length} ${
                category.clients.length === 1 ? "client" : "clients"
              }`}
            />
            {/* Wrapping row, not a grid. A fixed column count strands a
                one-client category alone in a five-column row with the rest of
                the width empty beside it; fixed-width cells that wrap keep every
                category packed to the same left edge whatever its size. */}
            <ul className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-10 sm:mt-14 sm:gap-x-10 sm:gap-y-12">
              {category.clients.map((client) => (
                <li key={client.id} className="w-[calc(50%-0.75rem)] sm:w-[150px] lg:w-[170px]">
                  <ClientLogo client={client} />
                </li>
              ))}
            </ul>
          </Section>
        ))
      )}

      <Section tone="deep">
        <div className="max-w-2xl">
          <SectionHeading
            label="Work with MOSSANO"
            title="Let's Create Something Timeless"
            intro="Tell the sourcing desk what the project needs."
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
