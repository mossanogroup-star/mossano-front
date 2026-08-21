import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { cn } from "@/shared/lib/cn";
import type { Media } from "@/shared/api/types";

interface Props {
  kind: "slab" | "application" | "collection" | "selection" | "video" | "general";
  /** Ordered — the sequence is the gallery order the customer sees. */
  value: string[];
  onChange: (ids: string[]) => void;
  label: string;
  hint?: string;
  max?: number;
}

/**
 * Upload and arrange images for a stone, Edit, project or selection.
 *
 * Order is data: the first image is what every card and link preview uses, so
 * reordering is a first-class action. A failed file never fails the batch —
 * losing forty slabs because the thirty-ninth was rejected is the wrong
 * behaviour, so per-file errors are surfaced individually.
 */
export function MediaPicker({ kind, value, onChange, label, hint, max = 40 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Resolves the selected ids to thumbnails. The library is fetched whole
  // rather than per id because the picker also offers it for reuse — Admin
  // Scope §1's "uploaded once, used across the website".
  const { data: library } = useQuery({
    queryKey: ["media", kind],
    queryFn: async () => (await adminApi.media({ kind, limit: 200 })).data,
  });

  const byId = new Map((library ?? []).map((m: Media) => [m.id, m]));
  const selected = value.map((id) => byId.get(id)).filter(Boolean) as Media[];

  const upload = useMutation({
    mutationFn: (files: File[]) => adminApi.uploadMedia(files, { kind }),
    onSuccess: (res) => {
      const uploaded = res.data;
      const failed = (res.meta?.failed as number) ?? 0;

      onChange([...value, ...uploaded.map((m) => m.id)].slice(0, max));
      queryClient.invalidateQueries({ queryKey: ["media"] });

      if (failed > 0) {
        const errors = (res.meta?.errors ?? []) as Array<{
          filename: string;
          message: string;
        }>;
        toast.warning(`${uploaded.length} uploaded, ${failed} could not be`, {
          description: errors.map((e) => `${e.filename}: ${e.message}`).join("\n"),
        });
      } else {
        toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded`);
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="label">{label}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending || value.length >= max}
          className="inline-flex items-center gap-2 font-sans text-[0.66rem] uppercase tracking-label text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.3} />
          {upload.isPending ? "Uploading…" : "Upload"}
        </button>
      </div>

      {hint && <p className="mt-1.5 text-[0.75rem] text-ink-faint">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={kind === "video" ? "video/*" : "image/*"}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) upload.mutate(files);
          // Reset, or selecting the same file twice in a row does nothing.
          e.target.value = "";
        }}
      />

      {selected.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {selected.map((media, i) => (
            <li
              key={media.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn(
                "group relative slab-frame aspect-square cursor-grab",
                dragIndex === i && "opacity-40",
              )}
            >
              <img
                src={media.thumbnailUrl}
                alt={media.alt}
                className="h-full w-full object-cover"
              />

              {/* The first image is what every card and link preview uses, so
                  it is labelled rather than left implicit. */}
              {i === 0 && (
                <span className="absolute left-0 top-0 bg-ink px-1.5 py-0.5 text-[0.55rem] uppercase tracking-label text-ivory">
                  Main
                </span>
              )}

              <button
                type="button"
                onClick={() => onChange(value.filter((id) => id !== media.id))}
                className="absolute right-0 top-0 bg-ink/80 p-1 text-ivory opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                aria-label={`Remove ${media.alt || "image"}`}
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>

              {/* Drag is the fast path; these are the accessible one. */}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  className="px-1 text-[0.6rem] text-ivory disabled:opacity-30"
                  aria-label="Move earlier"
                >
                  ←
                </button>
                <GripVertical className="h-3 w-3 text-ivory/50" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === selected.length - 1}
                  className="px-1 text-[0.6rem] text-ivory disabled:opacity-30"
                  aria-label="Move later"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full items-center justify-center border border-dashed border-ink/20 py-10 text-[0.8rem] text-ink-faint transition-colors hover:border-ink/40 hover:text-ink-soft"
        >
          Drop files here, or click to choose
        </button>
      )}
    </div>
  );
}
