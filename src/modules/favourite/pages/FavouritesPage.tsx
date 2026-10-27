import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { publicQueries } from "@/shared/api/publicQueries";
import { useFavourites } from "@/shared/hooks/useFavourites";
import { Section, EmptyState } from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { EnquiryForm } from "@/modules/enquiry/components/EnquiryForm";
import { Field, TextInput } from "@/modules/enquiry/components/Field";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";

/**
 * Website §5 — Favourites.
 *
 * The only public page that cannot be server-rendered with its content, and it
 * is the correct exception: the list lives on the device, so the server has no
 * idea what this visitor saved. It renders its empty frame on the server and
 * fills in on hydration, which is exactly why favourites are excluded from the
 * SSR prefetch rather than being made to work halfway.
 */
export function FavouritesPage() {
  const { slugs, count, clear } = useFavourites();
  const { whatsapp } = useSiteConfig();
  const { data, isLoading } = useQuery(publicQueries.favourites(slugs));
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  /**
   * Client request (27 Oct 2026) — who the PDF is for. It printed "Prepared
   * for: —"; it now asks first and fills the PDF's Prepared for panel.
   */
  const [askingDetails, setAskingDetails] = useState(false);
  const [details, setDetails] = useState({ name: "", phone: "", email: "", projectName: "" });

  const stones = data ?? [];

  /**
   * Phase-3 feedback — "wish list demo in pdf". The server builds it with the
   * private-selection layout, so what the customer keeps looks like what
   * MOSSANO sends. Fetched rather than linked because the shortlist lives on
   * this device and has to be POSTed.
   */
  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/public/favourites/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slugs,
          name: details.name.trim(),
          phone: details.phone.trim() || undefined,
          email: details.email.trim() || undefined,
          projectName: details.projectName.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("The PDF could not be prepared.");

      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "MOSSANO-Shortlist.pdf";
      link.click();
      URL.revokeObjectURL(url);
      setAskingDetails(false);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Section className="pt-24 sm:pt-28">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4">Favourites</p>
          <h1 className="h-display mt-2">Your Shortlist</h1>
          <p className="mt-6 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
            Saved on this device. No account needed — and nothing here is shared with MOSSANO until
            you send it.
          </p>
        </div>

        {count > 0 && (
          <button
            type="button"
            onClick={clear}
            className="border-b border-ink/25 pb-1 font-sans text-[0.66rem] uppercase tracking-label text-ink-faint transition-colors hover:border-ink hover:text-ink"
          >
            Clear all
          </button>
        )}
      </header>

      <div className="mt-14">
        {count === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            body="Save a stone from anywhere on the site and it will be here when you come back."
            action={
              <Link to="/shop" className="btn-outline">
                Browse the Stone Shop
              </Link>
            }
          />
        ) : isLoading ? (
          <div className="h-64" aria-busy="true" />
        ) : stones.length ? (
          <>
            <StoneGrid stones={stones} headingLevel={2} />

            {/* The point of a shortlist is sending it. Composed as a plain
                link so it survives with JavaScript disabled. */}
            <div className="mt-20 border-t border-ivory-dark pt-10">
              <p className="max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
                Send the shortlist to MOSSANO and they will confirm what is available, with actual
                slab photography.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <WhatsAppButton
                  href={`https://wa.me/${whatsapp.number}?text=${encodeURIComponent(
                    `Hi MOSSANO, I am interested in these lots: ${stones
                      .map((s) => `${s.mossanoCode} ${s.name}`)
                      .join(", ")}.`,
                  )}`}
                  label="Send this shortlist"
                />
                <button
                  type="button"
                  onClick={() => setAskingDetails((v) => !v)}
                  className="btn-outline"
                  aria-expanded={askingDetails}
                >
                  Download as PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSending((v) => !v)}
                  className="btn-outline"
                  aria-expanded={sending}
                >
                  Send it to MOSSANO
                </button>
              </div>

              {askingDetails && (
                <form
                  className="mt-12 max-w-xl"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void downloadPdf();
                  }}
                >
                  <p className="label mb-5">Who is this shortlist for?</p>
                  <div className="grid gap-x-6 sm:grid-cols-2">
                    <Field label="Name" htmlFor="pdf-name" required>
                      <TextInput
                        id="pdf-name"
                        required
                        value={details.name}
                        onChange={(e) => setDetails({ ...details, name: e.target.value })}
                      />
                    </Field>
                    <Field label="Project" htmlFor="pdf-project">
                      <TextInput
                        id="pdf-project"
                        value={details.projectName}
                        onChange={(e) => setDetails({ ...details, projectName: e.target.value })}
                      />
                    </Field>
                    <Field label="Phone" htmlFor="pdf-phone">
                      <TextInput
                        id="pdf-phone"
                        type="tel"
                        value={details.phone}
                        onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                      />
                    </Field>
                    <Field label="Email" htmlFor="pdf-email">
                      <TextInput
                        id="pdf-email"
                        type="email"
                        value={details.email}
                        onChange={(e) => setDetails({ ...details, email: e.target.value })}
                      />
                    </Field>
                  </div>
                  <button
                    type="submit"
                    disabled={downloading || !details.name.trim()}
                    className="btn-solid mt-4 disabled:opacity-50"
                  >
                    {downloading ? "Preparing…" : "Download PDF"}
                  </button>
                </form>
              )}

              {/* Phase-3 feedback — "if the client selects marble images, send
                  it to us". The WhatsApp route was the only one, and it needs
                  the customer to already be a WhatsApp contact; this reaches the
                  enquiry inbox with their details attached to the list. */}
              {sending && (
                <EnquiryForm
                  className="mt-12"
                  type="general"
                  subject={stones.map((s) => `${s.mossanoCode} ${s.name}`).join(", ")}
                  // The subject is display only, so the list goes in the
                  // message too — otherwise the inbox gets a name and no lots.
                  defaultMessage={`My shortlist: ${stones
                    .map((s) => `${s.mossanoCode} ${s.name}`)
                    .join(", ")}.`}
                  submitLabel="Send my shortlist"
                />
              )}
            </div>
          </>
        ) : (
          // Saved slugs that no longer resolve — withdrawn lots, or a list
          // carried over from an older version of the catalogue.
          <EmptyState
            title="These stones are no longer listed"
            body="The lots you saved have been withdrawn. MOSSANO can suggest what has replaced them."
            action={<WhatsAppButton href={whatsapp.general} label="Ask what is similar" />}
          />
        )}
      </div>
    </Section>
  );
}
