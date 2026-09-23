import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { MediaPicker } from "../../media/components/MediaPicker";
import { Field, TextInput, TextArea, Select } from "@/modules/enquiry/components/Field";
import { ApiError } from "@/shared/api/http";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";

/**
 * Phase-3 feedback — "for exotic marble we will upload pictures in the shop by
 * look section".
 *
 * Deliberately the same editor as ApplicationContentEditor, because it is the
 * same job: one look at a time, chosen from the taxonomy, upserted. The first
 * image becomes the tile on Shop by Look — until now that tile borrowed
 * whichever tagged stone sorted first, which is exactly what the client is
 * asking to stop for Exotic.
 */
export function LookContentEditor() {
  const queryClient = useQueryClient();
  const { taxonomies } = useSiteConfig();
  // Memoised: the `?? []` would otherwise be a fresh array each render and
  // re-run the effect below forever.
  const looks = useMemo(() => taxonomies?.looks ?? [], [taxonomies]);

  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [imageIds, setImageIds] = useState<string[]>([]);

  const { data: rows } = useQuery({
    queryKey: ["admin-look-content"],
    queryFn: () => adminApi.lookContent(),
  });

  useEffect(() => {
    if (!slug && looks.length) setSlug(looks[0].slug);
  }, [looks, slug]);

  // `rows` carries every look, so switching between them costs no request.
  useEffect(() => {
    const row = rows?.find((r) => r.look === slug);
    setHeadline(row?.headline ?? "");
    setDescription(row?.description ?? "");
    setImageIds((row?.images ?? []).map((m) => m.id));
  }, [rows, slug]);

  const save = useMutation({
    mutationFn: (body: unknown) => adminApi.saveLookContent(slug, body),
    onSuccess: () => {
      toast.success("Look page saved");
      queryClient.invalidateQueries({ queryKey: ["admin-look-content"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save that"),
  });

  const written = (s: string) => {
    const row = rows?.find((r) => r.look === s);
    return (row?.images.length ?? 0) > 0 || Boolean(row?.description);
  };

  return (
    <div className="border border-ivory-dark p-6">
      <p className="label">Look page content</p>
      <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-soft">
        The photography and copy on <span className="text-ink">Shop by Look</span>. The first image
        becomes the tile; without one, the look still borrows a tagged stone&rsquo;s photograph.
      </p>

      <Field label="Look" htmlFor="lc-slug">
        <Select id="lc-slug" value={slug} onChange={(e) => setSlug(e.target.value)}>
          {looks.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.label}
              {written(l.slug) ? "" : " — empty"}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Headline" htmlFor="lc-headline" hint="Blank uses the look's own name">
        <TextInput
          id="lc-headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </Field>

      <Field label="Description" htmlFor="lc-description">
        <TextArea
          id="lc-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <MediaPicker kind="look" label="Images" value={imageIds} onChange={setImageIds} max={40} />

      <button
        type="button"
        className="btn-solid mt-6 w-full"
        disabled={save.isPending || !slug}
        onClick={() =>
          save.mutate({
            headline: headline.trim() || undefined,
            description: description.trim() || undefined,
            imageIds,
          })
        }
      >
        {save.isPending ? "Saving…" : "Save look page"}
      </button>
    </div>
  );
}
