import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/shared/components/Wordmark";
import {
  isVisitorKnown,
  markVisitorKnown,
  recordImageView,
  viewedImageCount,
} from "@/shared/lib/visitor";
import { Field, TextInput } from "./Field";
import { useSubmitEnquiry } from "../api/submitEnquiry";

/**
 * Asks a new visitor for their email and phone number when they go to open a
 * third image — a stone, a project, any photograph on the storefront. The first
 * two are free.
 *
 * Images are counted, not clicks: opening a stone from the shop and then
 * zooming into that same stone's photograph is one image, not two. An image is
 * identified by its file name, which is the same whatever size it is served at.
 *
 * It is asked once per browser. When the details are sent the popup goes away
 * and is never shown again, on this visit or the next. Until then it cannot be
 * dismissed: that is the point of it. The details land in the enquiry inbox as
 * a "Website visitor" lead, with the page they were on.
 *
 * If the server cannot take the details (offline, down, rate limited) the
 * visitor is let through anyway — a broken API must never lock someone out of
 * the site.
 */
/** Different images a visitor may open before being asked. */
const FREE_IMAGES = 2;

/** Photography, not flags or icons: anything smaller than this is ignored. */
const MIN_IMAGE_SIZE = 80;

/** Chrome, panels and forms where an image click is not "viewing" anything. */
const IGNORE = "header, footer, dialog, [role='dialog'], form, [data-visitor-gate-ignore]";

const MEDIA = "img, video, picture";

function isBigEnough(el: Element) {
  const rect = el.getBoundingClientRect();
  return rect.width >= MIN_IMAGE_SIZE && rect.height >= MIN_IMAGE_SIZE;
}

/**
 * Did this click open or land on a photograph?
 *
 * Three shapes on this site: a bare <img>; a button or link that wraps the
 * image (the zoomable slab, the project tiles); and the stone card, whose link
 * is stretched over the photograph by an ::after, so the image sits *under* the
 * click rather than inside the element clicked. The last is found by looking at
 * everything beneath the pointer — but not for labelled icon controls (slider
 * arrows, dots), which also sit over images and are not opening one.
 */
function imageKey(el: Element): string | null {
  const src =
    (el as HTMLImageElement).currentSrc ||
    el.getAttribute("src") ||
    el.querySelector("source")?.getAttribute("src") ||
    el.getAttribute("poster");
  if (!src) return null;
  // The file name: Cloudinary puts the size in the path, not the name.
  const file = src.split(/[?#]/)[0].split("/").pop() ?? "";
  return file.replace(/\.[a-z0-9]+$/i, "") || src;
}

/** The image this click opened, or null if it did not open one. */
function clickedImage(event: MouseEvent): string | null {
  const target = event.target;
  if (!(target instanceof Element) || target.closest(IGNORE)) return null;

  const found: Element[] = [];
  if (target.matches(MEDIA)) found.push(target);

  const control = target.closest("a, button, [role='button']");
  if (control) found.push(...control.querySelectorAll(MEDIA));

  if (!control || !control.hasAttribute("aria-label")) {
    found.push(
      ...document.elementsFromPoint(event.clientX, event.clientY).filter((el) => el.matches(MEDIA)),
    );
  }

  const image = found.find(isBigEnough);
  return image
    ? imageKey(image.matches("picture") ? (image.querySelector("img") ?? image) : image)
    : null;
}

export function VisitorGate() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // Watch image clicks across the whole storefront. Capture phase, so a
  // component that stops propagation cannot hide a click from it.
  useEffect(() => {
    if (isVisitorKnown()) return;

    const onClick = (event: MouseEvent) => {
      if (open || isVisitorKnown()) return;
      const image = clickedImage(event);
      if (!image) return;

      recordImageView(image);
      if (viewedImageCount() > FREE_IMAGES) {
        // After the click has done its own work — opened the lightbox or
        // navigated — so the popup is stacked on top of it, not under it.
        window.setTimeout(() => setOpen(true), 250);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [open]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const finish = () => setOpen(false);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="visitor-gate-title"
      // Escape must not dismiss it. Some browsers allow a second Escape through
      // regardless, so a close that was not ours reopens it.
      onCancel={(event) => event.preventDefault()}
      onClose={() => {
        if (open && !isVisitorKnown()) dialog.current?.showModal();
      }}
      className="w-[min(26rem,calc(100vw-2rem))] border border-ink bg-ivory p-0 text-ink backdrop:bg-ink/80 backdrop:backdrop-blur-sm"
    >
      {open && <VisitorForm onDone={finish} />}
    </dialog>
  );
}

function VisitorForm({ onDone }: { onDone: () => void }) {
  const submit = useSubmitEnquiry();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    const mobile = phone.trim();
    if (!address) return setError("Please add your email address");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
      return setError("Please check your email address");
    if (!mobile) return setError("Please add your phone number");
    // Same rule as the server's phoneSchema, so the visitor hears it here.
    if (mobile.replace(/\D/g, "").length < 8) return setError("Please check your phone number");
    setError(null);

    submit.mutate(
      {
        type: "visitor",
        email: address,
        phone: mobile,
        message: "Shared their details after viewing images on the website.",
      },
      {
        onSuccess: () => {
          markVisitorKnown({ email: address, phone: mobile });
          onDone();
        },
        onError: (err) => {
          // A 400/422 is something the visitor can fix — show it. Anything else
          // is our side failing, and they are let through rather than trapped.
          if (err.status === 400 || err.status === 422) return;
          markVisitorKnown({ email: address, phone: mobile });
          onDone();
        },
      },
    );
  };

  const message = error ?? submit.error?.message;

  return (
    // data-visitor-gate-ignore: the dialog is already ignored, this is belt and
    // braces should it ever be rendered outside one.
    <form onSubmit={send} noValidate className="px-6 py-6" data-visitor-gate-ignore>
      <Wordmark className="block text-[0.8rem]" />
      <h2
        id="visitor-gate-title"
        className="mt-4 font-display text-[1.3rem] uppercase leading-tight tracking-wide"
      >
        Thank you for visiting
      </h2>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
        We are glad to have you here. Please share your details to be a part of MOSSANO.
      </p>

      <Field label="Email" htmlFor="visitor-gate-email" required className="mt-5">
        <TextInput
          id="visitor-gate-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={160}
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field label="Phone number" htmlFor="visitor-gate-phone" required className="mt-2">
        <TextInput
          id="visitor-gate-phone"
          type="tel"
          autoComplete="tel"
          maxLength={24}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>

      {message && (
        <p className="mt-1 text-[0.8rem] text-[#b23b2e]" role="alert">
          {message}
        </p>
      )}

      <button type="submit" className="btn-solid mt-5 w-full" disabled={submit.isPending}>
        {submit.isPending ? "Sending…" : "Share my details"}
      </button>
    </form>
  );
}
