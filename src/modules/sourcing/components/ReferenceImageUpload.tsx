import { useRef, useState } from "react";
import { useUploadReferenceImages } from "../api/uploadReferenceImages";
import { cn } from "@/shared/lib/cn";
import type { Media } from "@/shared/api/types";

export const MAX_REFERENCE_IMAGES = 3;

/**
 * Phase-3 feedback — "upload reference image dialogue box be highlighted, and
 * on page upload reference image should be there like sourcing desk".
 *
 * Lifted out of the Private Sourcing page so the stone enquiry form can offer
 * the same thing. It was a thin outline button on the longest form on the site,
 * which is the one place a customer skims: it is a dashed panel now, which is
 * what "dialogue box" means here — it reads as somewhere to drop a photograph
 * rather than as one more secondary action.
 *
 * Images upload as they are chosen rather than with the form, so a photograph
 * that is too large is reported before the brief is written, not after it is
 * lost. The parent holds the resulting ids and submits them.
 */
interface Props {
  images: Media[];
  onChange: (images: Media[]) => void;
  /** Unique per form — two uploaders on one page must not share an id. */
  id?: string;
  className?: string;
}

export function ReferenceImageUpload({
  images,
  onChange,
  id = "reference-images",
  className,
}: Props) {
  const upload = useUploadReferenceImages();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const full = images.length >= MAX_REFERENCE_IMAGES;

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);

    const room = MAX_REFERENCE_IMAGES - images.length;
    if (room <= 0) {
      setError(`You can attach up to ${MAX_REFERENCE_IMAGES} images.`);
      return;
    }

    try {
      const result = await upload.mutateAsync(Array.from(files).slice(0, room));
      onChange([...images, ...result.images]);
      if (result.errors.length) {
        setError(result.errors.map((e) => `${e.filename}: ${e.message}`).join(" "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "That image could not be uploaded.");
    } finally {
      // Cleared so choosing the same file again still fires a change event.
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className={className}>
      {/* The input is visually hidden rather than absent, so the label stays a
          real form control for the keyboard and for screen readers. */}
      <input
        ref={fileInput}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => void onPickFiles(e.target.files)}
      />

      <label
        htmlFor={id}
        // Drag and drop on top of the click target: both end in the same
        // handler, so the panel accepts a photograph dragged off a desktop.
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onPickFiles(e.dataTransfer.files);
        }}
        className={cn(
          "block cursor-pointer border border-dashed border-brass/60 bg-brass/[0.04] px-6 py-8 text-center transition-colors hover:border-brass hover:bg-brass/[0.08]",
          (upload.isPending || full) && "pointer-events-none opacity-55",
        )}
      >
        <span className="block font-display text-[1.05rem] uppercase tracking-wide text-ink">
          {upload.isPending ? "Uploading…" : "Upload your reference image"}
        </span>
        <span className="mt-2 block text-[0.85rem] leading-relaxed text-ink-soft">
          A photograph of the stone, a mood board, or a drawing — anything that shows what you are
          after. Drag one in, or click to choose. Up to {MAX_REFERENCE_IMAGES}; JPEG, PNG, WebP or
          HEIC.
        </span>
      </label>

      {images.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-4">
          {images.map((image) => (
            <li key={image.id} className="relative">
              <img
                src={image.url}
                alt={image.alt || "Reference image you attached"}
                className="h-24 w-24 object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => onChange(images.filter((m) => m.id !== image.id))}
                className="absolute right-1 top-1 bg-ink/75 px-2 py-1 text-[0.65rem] uppercase tracking-label text-ivory transition-colors hover:bg-ink"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-4 text-[0.8rem] text-[#b23b2e]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
