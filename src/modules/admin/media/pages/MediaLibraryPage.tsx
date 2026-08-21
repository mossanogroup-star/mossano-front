import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { PageHeader, TableEmpty } from "../../components/AdminUi";
import { cn } from "@/shared/lib/cn";
import type { Media } from "@/shared/api/types";

const KINDS = [
  { value: "", label: "Everything" },
  { value: "slab", label: "Slabs" },
  { value: "application", label: "Projects" },
  { value: "collection", label: "Collections" },
  { value: "selection", label: "Selections" },
  { value: "video", label: "Video" },
  { value: "reference", label: "Customer references" },
];

/**
 * Every uploaded file in one place.
 *
 * Alt text is editable here and not buried, because the storefront is almost
 * entirely photography — without it a screen reader gets nothing at all from a
 * stone page, and it is also what a search engine reads.
 */
export function MediaLibraryPage() {
  const [kind, setKind] = useState("");
  const [selected, setSelected] = useState<Media | null>(null);
  const [alt, setAlt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["media-library", kind],
    queryFn: async () =>
      (await adminApi.media({ kind: kind || undefined, limit: 200 })).data,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["media"] });

  const upload = useMutation({
    mutationFn: (files: File[]) =>
      adminApi.uploadMedia(files, { kind: kind || "general" }),
    onSuccess: (res) => {
      toast.success(`${res.data.length} uploaded`);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  const updateAlt = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) =>
      adminApi.updateMedia(id, { alt: value }),
    onSuccess: () => {
      toast.success("Alt text saved");
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteMedia(id),
    onSuccess: () => {
      toast.success("Deleted");
      setSelected(null);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
    },
  });

  const media = data ?? [];

  return (
    <>
      <PageHeader
        title="Media"
        subtitle="Uploaded once, used anywhere on the site."
        actions={
          <button
            type="button"
            className="btn-solid"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="h-4 w-4" strokeWidth={1.3} />
            {upload.isPending ? "Uploading…" : "Upload"}
          </button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) upload.mutate(files);
          e.target.value = "";
        }}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => setKind(k.value)}
            className={cn(
              "px-3 py-1.5 font-sans text-[0.7rem] uppercase tracking-label transition-colors",
              kind === k.value
                ? "bg-ink text-ivory"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div>
          {media.length ? (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {media.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      setAlt(item.alt);
                    }}
                    className={cn(
                      "slab-frame aspect-square w-full",
                      selected?.id === item.id && "ring-1 ring-brass",
                      // Missing alt text is a real defect on a photography-led
                      // site, so it is visible in the grid rather than only in
                      // the panel.
                      !item.alt &&
                        "outline outline-1 outline-offset-2 outline-[#d9a318]/50",
                    )}
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt={item.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <TableEmpty message="Nothing here yet." />
          )}
        </div>

        <aside className="border-t border-ivory-dark pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          {selected ? (
            <>
              <div className="slab-frame aspect-square">
                <img
                  src={selected.url}
                  alt={selected.alt}
                  className="h-full w-full object-cover"
                />
              </div>

              <dl className="mt-4 space-y-1 text-[0.75rem] text-ink-faint">
                <div>{selected.kind}</div>
                {selected.width && selected.height && (
                  <div>
                    {selected.width} × {selected.height} px
                  </div>
                )}
                {selected.bytes && (
                  <div>{Math.round(selected.bytes / 1024)} KB</div>
                )}
              </dl>

              <label className="label mt-6 block" htmlFor="alt">
                Alt text
              </label>
              <textarea
                id="alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                rows={3}
                placeholder="Describe the stone as someone who cannot see it would need it described."
                className="mt-1.5 w-full border-0 border-b border-ink/20 bg-transparent py-2 text-[0.85rem] focus:border-ink focus:outline-none"
              />

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="btn-outline flex-1"
                  disabled={updateAlt.isPending || alt === selected.alt}
                  onClick={() =>
                    updateAlt.mutate({ id: selected.id, value: alt })
                  }
                >
                  Save
                </button>
                <button
                  type="button"
                  className="border border-[#b23b2e]/40 px-3 text-[#b23b2e] transition-colors hover:bg-[#b23b2e] hover:text-ivory"
                  onClick={() => remove.mutate(selected.id)}
                  aria-label="Delete this file"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.3} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-[0.85rem] text-ink-faint">
              Choose a file to edit its alt text. Files outlined in amber have
              none.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
