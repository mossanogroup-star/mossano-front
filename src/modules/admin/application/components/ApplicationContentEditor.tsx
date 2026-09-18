import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { MediaPicker } from "../../media/components/MediaPicker";
import { Field, TextInput, TextArea, Select } from "@/modules/enquiry/components/Field";
import { ApiError } from "@/shared/api/http";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";

/**
 * Phase-2 feedback §5 — the images and copy on a Shop by Application page.
 *
 * One application at a time, chosen from the taxonomy: there are seven and they
 * are fixed by the requirement document, so this is a picker rather than a list
 * of records to create. Saving upserts, which is why there is no "add" and no
 * "delete" — a page always exists, it is just empty until someone writes it.
 */
export function ApplicationContentEditor() {
  const queryClient = useQueryClient();
  const { taxonomies } = useSiteConfig();
  // Memoised: the `?? []` would otherwise be a fresh array each render and
  // re-run the effect below forever.
  const applications = useMemo(() => taxonomies?.applications ?? [], [taxonomies]);

  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [imageIds, setImageIds] = useState<string[]>([]);

  const { data: rows } = useQuery({
    queryKey: ["admin-application-content"],
    queryFn: () => adminApi.applicationContent(),
  });

  useEffect(() => {
    if (!slug && applications.length) setSlug(applications[0].slug);
  }, [applications, slug]);

  // Load whichever application is selected. `rows` carries every one, so
  // switching between them costs no request.
  useEffect(() => {
    const row = rows?.find((r) => r.application === slug);
    setHeadline(row?.headline ?? "");
    setDescription(row?.description ?? "");
    setImageIds((row?.images ?? []).map((m) => m.id));
  }, [rows, slug]);

  const save = useMutation({
    mutationFn: (body: unknown) => adminApi.saveApplicationContent(slug, body),
    onSuccess: () => {
      toast.success("Application page saved");
      queryClient.invalidateQueries({ queryKey: ["admin-application-content"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save that"),
  });

  const written = (s: string) => {
    const row = rows?.find((r) => r.application === s);
    return (row?.images.length ?? 0) > 0 || Boolean(row?.description);
  };

  return (
    <div className="border border-ivory-dark p-6">
      <p className="label">Application page content</p>
      <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-soft">
        The images and copy on <span className="text-ink">Shop by Application</span>. Separate from
        projects — these show the use case, not a named development.
      </p>

      <Field label="Application" htmlFor="ac-slug">
        <Select id="ac-slug" value={slug} onChange={(e) => setSlug(e.target.value)}>
          {applications.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.label}
              {written(a.slug) ? "" : " — empty"}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Headline" htmlFor="ac-headline" hint="Blank uses the application's own name">
        <TextInput
          id="ac-headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </Field>

      <Field label="Description" htmlFor="ac-description">
        <TextArea
          id="ac-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <MediaPicker
        kind="application"
        label="Images"
        value={imageIds}
        onChange={setImageIds}
        max={40}
      />

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
        {save.isPending ? "Saving…" : "Save application page"}
      </button>
    </div>
  );
}
