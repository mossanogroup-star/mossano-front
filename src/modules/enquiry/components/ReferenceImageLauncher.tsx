import { useEffect, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { Wordmark } from "@/shared/components/Wordmark";
import { cn } from "@/shared/lib/cn";
import { ReferenceImageUpload } from "@/modules/sourcing/components/ReferenceImageUpload";
import { Field, TextInput } from "./Field";
import { useSubmitEnquiry } from "../api/submitEnquiry";
import type { Media } from "@/shared/api/types";

/**
 * Phase-3 feedback — "Upload your reference image", on every page, sitting
 * directly above the Sourcing Desk launcher and working the same way.
 *
 * The photograph and a mobile number, nothing else — no name, no email; the
 * client was explicit. Both are required: an image with no number is a lead
 * nobody can call back. It lands in the enquiry inbox as its own type, with the images
 * under the brief, so the team sees it beside every other lead.
 *
 * Highlighted in brass where the Sourcing Desk is ivory: the client asked for
 * it to stand out, and two identical buttons stacked in a corner read as one.
 *
 * Only one of the two panels is open at a time — they share the corner. Each
 * announces itself on `mossano:panel` and closes when the other opens.
 */
export const PANEL_EVENT = "mossano:panel";

export function ReferenceImageLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPanel = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== "reference") setOpen(false);
    };
    window.addEventListener(PANEL_EVENT, onPanel);
    return () => window.removeEventListener(PANEL_EVENT, onPanel);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = () => {
    if (!open) window.dispatchEvent(new CustomEvent(PANEL_EVENT, { detail: "reference" }));
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="mossano-reference"
        className={cn(
          "fixed bottom-[4.5rem] right-5 z-40 inline-flex items-center gap-2.5 border px-5 py-3",
          "font-sans text-[0.66rem] uppercase tracking-label transition-colors duration-200",
          open
            ? "border-ink bg-ink text-ivory"
            : "border-brass bg-brass-light text-ink hover:border-ink hover:bg-ink hover:text-ivory",
        )}
      >
        {open ? (
          <X className="h-4 w-4" strokeWidth={1.3} aria-hidden="true" />
        ) : (
          <ImageUp className="h-4 w-4" strokeWidth={1.3} aria-hidden="true" />
        )}
        {open ? "Close" : "Upload your reference image"}
      </button>

      {/* Unmounted when closed, so reopening after a submission starts a new
          enquiry instead of showing the last one's thank-you. */}
      {open && (
        <section
          id="mossano-reference"
          role="dialog"
          aria-label="Upload your reference image"
          className="fixed bottom-[8.25rem] right-5 z-40 flex max-h-[min(36rem,calc(100svh-13rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col border border-ink bg-ivory"
        >
          <header className="shrink-0 border-b border-ivory-dark px-5 py-4">
            <Wordmark className="block text-[0.8rem]" />
            <p className="label mt-0.5">Upload your reference image</p>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <ReferencePanel />
          </div>
        </section>
      )}
    </>
  );
}

function ReferencePanel() {
  const submit = useSubmitEnquiry();
  const [images, setImages] = useState<Media[]>([]);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (submit.isSuccess) {
    return (
      <p className="text-[0.9rem] leading-relaxed text-ink-soft">
        Thank you — MOSSANO has your reference. Your reference number is{" "}
        <span className="text-ink">{submit.data.reference}</span>.
      </p>
    );
  }

  const send = () => {
    const mobile = phone.trim();
    if (!images.length) return setError("Add at least one reference image");
    if (!mobile) return setError("Add your mobile number so MOSSANO can reply");
    // Same rule as the server's phoneSchema, so the customer hears it here.
    if (mobile.replace(/\D/g, "").length < 8) return setError("Enter a valid mobile number");
    setError(null);
    submit.mutate({
      type: "reference_image",
      phone: mobile,
      sourcing: { referenceImages: images.map((image) => image.id) },
    });
  };

  const message = error ?? submit.error?.message;

  return (
    <>
      <ReferenceImageUpload id="launcher-reference-images" images={images} onChange={setImages} />
      <Field label="Mobile number" htmlFor="launcher-reference-phone" required className="mt-5">
        <TextInput
          id="launcher-reference-phone"
          type="tel"
          autoComplete="tel"
          maxLength={24}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>
      {message && (
        <p className="mt-3 text-[0.8rem] text-[#b23b2e]" role="alert">
          {message}
        </p>
      )}
      <button
        type="button"
        className="btn-solid mt-5 w-full"
        disabled={submit.isPending}
        onClick={send}
      >
        {submit.isPending ? "Sending…" : "Send"}
      </button>
    </>
  );
}
