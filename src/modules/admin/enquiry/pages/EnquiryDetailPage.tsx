import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { PageHeader, Pill } from "../../components/AdminUi";
import { TextArea } from "@/modules/enquiry/components/Field";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import type { EnquiryStatus } from "@/shared/api/types";

const PIPELINE: EnquiryStatus[] = ["new", "contacted", "interested", "reserved", "purchased"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex gap-4 border-b border-ivory-dark py-2.5">
      <dt className="label w-32 shrink-0">{label}</dt>
      <dd className="text-[0.88rem]">{children}</dd>
    </div>
  );
}

/**
 * One enquiry, and everything needed to answer it without leaving the screen —
 * including a WhatsApp link with the customer's own number and the stone code
 * already in the message.
 */
export function EnquiryDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const { whatsapp } = useSiteConfig();
  const [note, setNote] = useState("");

  const { data: enquiry } = useQuery({
    queryKey: ["admin-enquiry", id],
    queryFn: () => adminApi.enquiry(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-enquiry", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const setStatus = useMutation({
    mutationFn: (status: EnquiryStatus) => adminApi.setEnquiryStatus(id, status),
    onSuccess: () => invalidate(),
  });

  const addNote = useMutation({
    mutationFn: (body: string) => adminApi.addEnquiryNote(id, body),
    onSuccess: () => {
      setNote("");
      toast.success("Note added");
      invalidate();
    },
  });

  if (!enquiry) return <p className="label">Loading…</p>;

  const stoneCode = enquiry.stone?.mossanoCode ?? enquiry.stoneSnapshot?.mossanoCode;
  const stoneName = enquiry.stone?.name ?? enquiry.stoneSnapshot?.name;

  // Replies go to the customer's own number where they gave one, falling back
  // to MOSSANO's line otherwise. A bare ten-digit number is Indian and gets the
  // country code; anything longer already carries one and is left alone, so a
  // customer who typed +971 is not silently rewritten to +91.
  const replyHref = (() => {
    if (!enquiry.phone) return whatsapp.general;
    const digits = enquiry.phone.replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length < 10) return whatsapp.general;
    const e164 = digits.length === 10 ? `91${digits}` : digits;
    const greeting = `Hi ${enquiry.name}, thank you for your enquiry${
      stoneCode ? ` about ${stoneCode} ${stoneName}` : ""
    } (${enquiry.reference}).`;
    return `https://wa.me/${e164}?text=${encodeURIComponent(greeting)}`;
  })();

  return (
    <>
      <PageHeader
        title={enquiry.name}
        subtitle={`${enquiry.reference} · ${enquiry.typeLabel} · ${new Date(enquiry.createdAt).toLocaleString("en-IN")}`}
        actions={
          <>
            <Link to="/admin/enquiries" className="btn-outline">
              Back
            </Link>
            <WhatsAppButton href={replyHref} label="Reply on WhatsApp" />
          </>
        }
      />

      {/* The pipeline as a row of steps, so the current stage and the next one
          are both visible — a dropdown hides where the lead actually is. */}
      <div className="mb-10 flex flex-wrap gap-2">
        {PIPELINE.map((stage) => {
          const isCurrent = enquiry.status === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setStatus.mutate(stage)}
              disabled={setStatus.isPending}
              className={`border px-4 py-2 font-sans text-[0.7rem] uppercase tracking-label transition-colors ${
                isCurrent
                  ? "border-ink bg-ink text-ivory"
                  : "border-ink/20 text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {stage}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setStatus.mutate("closed")}
          disabled={setStatus.isPending}
          className={`ml-auto border px-4 py-2 font-sans text-[0.7rem] uppercase tracking-label ${
            enquiry.status === "closed"
              ? "border-ink bg-ink text-ivory"
              : "border-ink/20 text-ink-faint hover:border-ink hover:text-ink"
          }`}
        >
          Close
        </button>
      </div>

      <div className="grid gap-x-12 lg:grid-cols-2">
        <section>
          <p className="label mb-4">Contact</p>
          <dl>
            <Row label="Name">{enquiry.name}</Row>
            <Row label="Company">{enquiry.company}</Row>
            <Row label="Project">{enquiry.projectName}</Row>
            <Row label="Phone">
              {enquiry.phone && <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>}
            </Row>
            <Row label="Email">
              {enquiry.email && <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>}
            </Row>
            <Row label="Came from">{enquiry.sourcePath}</Row>
          </dl>

          {stoneCode && (
            <>
              <p className="label mb-4 mt-10">The stone</p>
              <div className="flex items-center gap-4 border border-ivory-dark p-4">
                <span className="slab-frame h-14 w-20 shrink-0">
                  {enquiry.stone?.primaryImageUrl && (
                    <img
                      src={enquiry.stone.primaryImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9rem]">{stoneName}</span>
                  <span className="block text-[0.75rem] text-ink-faint">{stoneCode}</span>
                  {enquiry.stone?.id && (
                    <Link
                      to={`/admin/stones/${enquiry.stone.id}`}
                      className="label mt-1 inline-block underline-offset-4 hover:underline"
                    >
                      Open stone
                    </Link>
                  )}
                </span>
              </div>
              {/* The snapshot exists precisely so a renamed or withdrawn lot
                  still tells the team what was asked about. */}
              {!enquiry.stone && (
                <p className="mt-2 text-[0.75rem] text-ink-faint">
                  This lot is no longer in the catalogue. The code and name above are as they
                  were when the enquiry was sent.
                </p>
              )}
            </>
          )}

          {enquiry.sourcing && (
            <>
              <p className="label mb-4 mt-10">Sourcing brief</p>
              <dl>
                <Row label="Material">{enquiry.sourcing.material}</Row>
                <Row label="Colour">{enquiry.sourcing.colour}</Row>
                <Row label="Thickness">{enquiry.sourcing.thickness}</Row>
                <Row label="Quantity">{enquiry.sourcing.quantity}</Row>
                <Row label="Budget">{enquiry.sourcing.budget}</Row>
                <Row label="Location">{enquiry.sourcing.projectLocation}</Row>
                {/* Rendered as written. It is the customer's own phrasing —
                    "1 month", "before Diwali" — not a date. */}
                <Row label="Required by">{enquiry.sourcing.requiredBy}</Row>
              </dl>

              {/* Website §8's "please select the best options for my project" —
                  this is the flag that turns a brief into a private selection. */}
              {enquiry.sourcing.wantsMossanoToSelect && (
                <div className="mt-5 border-l border-brass bg-brass/5 p-4">
                  <p className="text-[0.85rem]">
                    <Pill tone="brass">Asked MOSSANO to choose</Pill>
                  </p>
                  <p className="mt-2 text-[0.85rem] text-ink-soft">
                    Build a private selection and send them the link.
                  </p>
                  <Link
                    to={`/admin/selections/new?enquiry=${enquiry.id}`}
                    className="btn-outline mt-4"
                  >
                    Create a selection
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        <section>
          {(enquiry.requirement || enquiry.message) && (
            <>
              <p className="label mb-4">What they wrote</p>
              {enquiry.requirement && (
                <p className="mb-4 text-[0.9rem] leading-relaxed">{enquiry.requirement}</p>
              )}
              {enquiry.message && (
                <p className="whitespace-pre-wrap border-l border-ivory-dark pl-4 text-[0.9rem] leading-relaxed text-ink-soft">
                  {enquiry.message}
                </p>
              )}
            </>
          )}

          <p className="label mb-4 mt-10">Notes</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (note.trim()) addNote.mutate(note.trim());
            }}
          >
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What happened on the call…"
              rows={3}
            />
            <button
              type="submit"
              className="btn-outline mt-3"
              disabled={addNote.isPending || !note.trim()}
            >
              {addNote.isPending ? "Adding…" : "Add note"}
            </button>
          </form>

          <ul className="mt-8 space-y-5">
            {enquiry.notes.map((n) => (
              <li key={n.id} className="border-l border-ivory-dark pl-4">
                <p className="whitespace-pre-wrap text-[0.88rem] leading-relaxed">{n.body}</p>
                <p className="mt-1.5 text-[0.72rem] text-ink-faint">
                  {n.authorName} · {new Date(n.createdAt).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
            {!enquiry.notes.length && (
              <li className="text-[0.85rem] text-ink-faint">No notes yet.</li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
