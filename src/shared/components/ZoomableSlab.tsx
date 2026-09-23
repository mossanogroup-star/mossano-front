import { useRef } from "react";
import { Slab } from "./Slab";
import type { Media } from "../api/types";

type SlabProps = Parameters<typeof Slab>[0];

interface Props extends SlabProps {
  /** Phase-3 feedback: the stone's name and code, nothing else. */
  caption?: string | null;
  /** Full-resolution source. Falls back to whatever the thumbnail used. */
  fullUrl?: string | null;
}

/**
 * Phase-3 feedback — "all application images should be available open on big
 * screen".
 *
 * A native <dialog>: the browser already does the backdrop, the focus trap,
 * Escape to close and returning focus to the button that opened it. A library
 * would reimplement all four, worse.
 *
 * The dialog holds a plain <img> rather than another Slab, because the point of
 * opening it is to stop cropping the photograph to an aspect ratio.
 */
export function ZoomableSlab({ caption, fullUrl, ...slab }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const src = fullUrl ?? (slab.media as Media | null | undefined)?.url ?? slab.url ?? null;

  // Nothing to enlarge — the placeholder state stays exactly as it was.
  if (!src) return <Slab {...slab} />;

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`View ${caption || slab.alt} full screen`}
        className="group block w-full cursor-zoom-in text-left"
      >
        <Slab {...slab} />
      </button>

      <dialog
        ref={dialog}
        // Clicking the backdrop is clicking the dialog itself: the image and
        // caption inside stop the event, so only the surround closes it.
        onClick={() => dialog.current?.close()}
        className="max-h-[92vh] max-w-[94vw] bg-transparent p-0 backdrop:bg-ink/85"
      >
        <figure onClick={(e) => e.stopPropagation()} className="relative">
          <img
            src={src}
            alt={slab.alt}
            className="max-h-[84vh] w-auto max-w-[94vw] object-contain"
          />
          <figcaption className="mt-3 flex items-baseline justify-between gap-6">
            <span className="font-sans text-[0.75rem] uppercase tracking-label text-ivory/80">
              {caption}
            </span>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="font-sans text-[0.75rem] uppercase tracking-label text-ivory/60 underline-offset-4 hover:text-ivory hover:underline"
            >
              Close
            </button>
          </figcaption>
        </figure>
      </dialog>
    </>
  );
}
