import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { PageHeader, Pill } from "../../components/AdminUi";
import { useSession } from "../../auth/useSession";
import { StonePicker } from "../../components/StonePicker";
import { MediaPicker } from "../../media/components/MediaPicker";
import { Field, TextInput, TextArea } from "@/modules/enquiry/components/Field";

/** Curate one Edit: its copy, its cover imagery, and the stones in it. */
export function EditDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();

  const { data: edit } = useQuery({
    queryKey: ["admin-edit", id],
    queryFn: () => adminApi.edit(id),
  });

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
  });
  const [imageIds, setImageIds] = useState<string[]>([]);

  useEffect(() => {
    if (!edit) return;
    setForm({
      title: edit.title,
      subtitle: edit.subtitle,
      description: edit.description,
    });
    setImageIds(edit.imageIds);
  }, [edit]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-edit", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-edits"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const save = useMutation({
    mutationFn: (body: unknown) => adminApi.updateEdit(id, body),
    onSuccess: () => {
      toast.success("Saved");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });

  const addStones = useMutation({
    mutationFn: (stoneIds: string[]) => adminApi.addStonesToEdit(id, stoneIds),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not add"),
  });

  const removeStone = useMutation({
    mutationFn: (stoneId: string) => adminApi.removeStoneFromEdit(id, stoneId),
    onSuccess: () => invalidate(),
  });

  const navigate = useNavigate();
  const isAdmin = useSession().user?.role === "admin";

  const publish = useMutation({
    mutationFn: (isPublished: boolean) => adminApi.updateEdit(id, { isPublished }),
    onSuccess: (saved) => {
      toast.success(saved.isPublished ? `${saved.title} is live` : `${saved.title} hidden`);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update"),
  });

  const remove = useMutation({
    mutationFn: () => adminApi.deleteEdit(id),
    onSuccess: () => {
      toast.success("Edit removed");
      queryClient.invalidateQueries({ queryKey: ["admin-edits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/admin/edits", { replace: true });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not remove"),
  });

  if (!edit) return <p className="label">Loading…</p>;

  return (
    <>
      <PageHeader
        title={edit.title}
        subtitle={`${edit.statusLabel} · ${edit.stoneCount} stone${edit.stoneCount === 1 ? "" : "s"}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {edit.isPublished ? <Pill tone="brass">Live</Pill> : <Pill tone="muted">Draft</Pill>}
            <Link to="/admin/edits" className="btn-outline">
              Back
            </Link>
            <button
              type="button"
              onClick={() => publish.mutate(!edit.isPublished)}
              disabled={publish.isPending}
              className={edit.isPublished ? "btn-outline" : "btn-solid"}
            >
              {edit.isPublished ? "Hide from site" : "Publish"}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Remove the Edit "${edit.title}"?`)) remove.mutate();
                }}
                disabled={remove.isPending}
                className="btn-outline hover:border-[#b23b2e] hover:bg-[#b23b2e]"
              >
                Delete
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-x-12 lg:grid-cols-2">
        <section>
          <p className="label mb-5">Collection details</p>
          <Field label="Title" htmlFor="title" hint="Shown as the band heading, e.g. August 2026">
            <TextInput
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Subtitle" htmlFor="subtitle">
            <TextInput
              id="subtitle"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </Field>
          <Field label="Description" htmlFor="description">
            <TextArea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <button
            type="button"
            className="btn-solid"
            disabled={save.isPending}
            onClick={() => save.mutate({ ...form, imageIds })}
          >
            {save.isPending ? "Saving…" : "Save details"}
          </button>

          <div className="mt-12">
            <MediaPicker
              kind="collection"
              label="Collection imagery"
              hint="The first image is the Edit's cover and its link preview."
              value={imageIds}
              onChange={setImageIds}
              max={20}
            />
          </div>
        </section>

        <section>
          <p className="label mb-5">Stones in this Edit</p>

          {/* Stones are added by reference, never copied — Admin Scope §6.
              A stone that sells shows as sold inside the Edit with no second
              write, because there is only one record. */}
          <StonePicker
            selectedIds={edit.stoneIds}
            onAdd={(stone) => addStones.mutate([stone.id])}
          />

          {edit.stones && edit.stones.length > 0 ? (
            <ul className="mt-6 divide-y divide-ivory-dark border-y border-ivory-dark">
              {edit.stones.map((stone, i) => (
                <li key={stone.id} className="flex items-center gap-4 py-3">
                  <span className="label w-6 shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="slab-frame h-10 w-14 shrink-0">
                    {stone.primaryImageUrl && (
                      <img
                        src={stone.primaryImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      to={`/admin/stones/${stone.id}`}
                      className="block truncate text-[0.88rem] hover:text-brass"
                    >
                      {stone.name}
                    </Link>
                    <span className="text-[0.72rem] text-ink-faint">
                      {stone.mossanoCode} · {stone.availabilityLabel}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStone.mutate(stone.id)}
                    disabled={removeStone.isPending}
                    className="shrink-0 text-ink-faint transition-colors hover:text-ink disabled:opacity-40"
                    aria-label={`Remove ${stone.name} from this Edit`}
                  >
                    <X className="h-4 w-4" strokeWidth={1.4} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 border-y border-ivory-dark py-10 text-center text-[0.85rem] text-ink-faint">
              No stones yet. Search above to add them.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
