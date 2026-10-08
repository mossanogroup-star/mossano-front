import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { PageHeader, AdminError } from "../../components/AdminUi";
import { MediaPicker } from "../../media/components/MediaPicker";
import { ApiError } from "@/shared/api/http";

/**
 * Phase-4 feedback (8 Oct 2026) — the home page's first image, and the two
 * pages the client took out of the menu without wanting them deleted.
 */
export function SiteSettingsPage() {
  const queryClient = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminApi.settings(),
  });

  const [heroIds, setHeroIds] = useState<string[]>([]);
  const [showLooks, setShowLooks] = useState(false);
  const [showApplications, setShowApplications] = useState(false);

  useEffect(() => {
    if (!data) return;
    setHeroIds(data.heroImage ? [data.heroImage.id] : []);
    setShowLooks(data.showLooks);
    setShowApplications(data.showApplications);
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      adminApi.saveSettings({ heroImageId: heroIds[0] ?? null, showLooks, showApplications }),
    onSuccess: () => {
      toast.success("Site settings saved");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save that"),
  });

  if (error) return <AdminError error={error} />;

  return (
    <>
      <PageHeader
        title="Site Settings"
        subtitle="The home page's first image, and which optional pages appear in the menu."
      />
      <div className="max-w-2xl space-y-8">
        <div className="border border-ivory-dark p-6">
          <p className="label">Home page image</p>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-soft">
            The full-screen image behind the MOSSANO wordmark — currently the Black Marquina slab.
            Upload or pick one to replace it. Dark images work best: the text is ivory. Remove it to
            go back to the automatic choice.
          </p>
          <MediaPicker kind="general" label="Image" value={heroIds} onChange={setHeroIds} max={1} />
        </div>

        <div className="border border-ivory-dark p-6">
          <p className="label">Optional pages</p>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-soft">
            Switched off, a page leaves the header, footer and home page. Its content stays here,
            ready to switch back on.
          </p>
          <label className="mt-6 flex items-center gap-3 text-[0.85rem]">
            <input
              type="checkbox"
              checked={showLooks}
              onChange={(e) => setShowLooks(e.target.checked)}
            />
            Show &ldquo;Shop by Look&rdquo;
          </label>
          <label className="mt-4 flex items-center gap-3 text-[0.85rem]">
            <input
              type="checkbox"
              checked={showApplications}
              onChange={(e) => setShowApplications(e.target.checked)}
            />
            Show &ldquo;Shop by Application&rdquo;
          </label>
        </div>

        <button
          type="button"
          className="btn-solid w-full"
          disabled={save.isPending || !data}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </>
  );
}
