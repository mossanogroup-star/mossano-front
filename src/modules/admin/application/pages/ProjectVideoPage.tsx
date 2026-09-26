import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { PageHeader, DataTable, TableEmpty, Pill } from "../../components/AdminUi";
import { MediaPicker } from "../../media/components/MediaPicker";
import { Field, TextInput } from "@/modules/enquiry/components/Field";
import type { ProjectVideo } from "@/shared/api/types";

const BLANK = { title: "", instagramUrl: "", location: "", isPublished: true };

/**
 * Phase-3 feedback — the Projects page's Videos tab.
 *
 * An uploaded file is what guarantees the video plays on the site: Instagram
 * decides per post whether its embed plays in place or sends the visitor off to
 * instagram.com, and many reels get the latter.
 */
export function ProjectVideoPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);
  const [videoIds, setVideoIds] = useState<string[]>([]);

  const { data } = useQuery({
    queryKey: ["admin-project-videos"],
    queryFn: () => adminApi.projectVideos(),
  });

  const reset = () => {
    setEditingId(null);
    setForm(BLANK);
    setVideoIds([]);
  };

  const edit = (video: ProjectVideo) => {
    setEditingId(video.id);
    setForm({
      title: video.title,
      instagramUrl: video.instagramUrl ?? "",
      location: video.location ?? "",
      isPublished: video.isPublished,
    });
    setVideoIds(video.videoId ? [video.videoId] : []);
  };

  const save = useMutation({
    mutationFn: (body: unknown) =>
      editingId ? adminApi.updateProjectVideo(editingId, body) : adminApi.createProjectVideo(body),
    onSuccess: () => {
      toast.success(editingId ? "Saved" : "Video added");
      queryClient.invalidateQueries({ queryKey: ["admin-project-videos"] });
      reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteProjectVideo(id),
    onSuccess: () => {
      toast.success("Removed");
      queryClient.invalidateQueries({ queryKey: ["admin-project-videos"] });
      reset();
    },
  });

  const videos = data ?? [];

  return (
    <>
      <PageHeader
        title="Project Videos"
        subtitle="Instagram reels, played on the Projects page's Videos tab."
      />

      <div className="grid gap-x-12 lg:grid-cols-[1fr_20rem]">
        <section>
          <DataTable
            head={["Video", "Source", ""]}
            empty={videos.length === 0 ? <TableEmpty message="No videos yet." /> : undefined}
          >
            {videos.map((video) => (
              <tr key={video.id} className="border-b border-ivory-dark/60">
                <td className="py-3 pr-6">
                  <button
                    type="button"
                    onClick={() => edit(video)}
                    className="text-left text-[0.88rem] hover:text-brass"
                  >
                    {video.title}
                  </button>
                  {video.location && (
                    <span className="block text-[0.73rem] text-ink-faint">{video.location}</span>
                  )}
                </td>
                <td className="max-w-[16rem] truncate py-3 pr-6 text-[0.8rem] text-ink-soft">
                  {video.video ? (
                    "Uploaded file"
                  ) : (
                    <a
                      href={video.instagramUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brass"
                    >
                      Instagram only
                    </a>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex gap-4">
                    {video.isPublished ? (
                      <Pill tone="brass">Live</Pill>
                    ) : (
                      <Pill tone="muted">Draft</Pill>
                    )}
                    <button
                      type="button"
                      onClick={() => remove.mutate(video.id)}
                      className="label hover:text-[#b23b2e]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </section>

        <aside className="mt-12 border-t border-ivory-dark pt-8 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="flex items-baseline justify-between">
            <p className="label">{editingId ? "Edit video" : "Add a video"}</p>
            {editingId && (
              <button type="button" onClick={reset} className="label hover:text-ink">
                New instead
              </button>
            )}
          </div>

          <div className="mt-5">
            <MediaPicker
              kind="video"
              label="Video file"
              hint="Plays on the website itself. Download the reel from Instagram and upload it here."
              value={videoIds}
              onChange={setVideoIds}
              max={1}
            />

            <Field
              label="Instagram URL"
              htmlFor="pv-url"
              hint="Optional with a file. On its own, Instagram may open reels on instagram.com."
            >
              <TextInput
                id="pv-url"
                placeholder="https://www.instagram.com/reel/…"
                value={form.instagramUrl}
                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              />
            </Field>
            <Field label="Title" htmlFor="pv-title" required>
              <TextInput
                id="pv-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Location" htmlFor="pv-location">
              <TextInput
                id="pv-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>

            <label className="mt-6 flex items-center gap-3 text-[0.85rem]">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              Show on the website
            </label>

            <button
              type="button"
              className="btn-solid mt-8 w-full"
              disabled={
                save.isPending || !form.title.trim() || (!form.instagramUrl.trim() && !videoIds[0])
              }
              onClick={() =>
                save.mutate({
                  ...form,
                  instagramUrl: form.instagramUrl.trim() || undefined,
                  video: videoIds[0],
                  location: form.location.trim() || undefined,
                })
              }
            >
              {save.isPending ? "Saving…" : editingId ? "Save video" : "Add video"}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
