import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { PageHeader, DataTable, TableEmpty, Pill } from "../../components/AdminUi";
import { StonePicker } from "../../components/StonePicker";
import { MediaPicker } from "../../media/components/MediaPicker";
import { Field, TextInput, TextArea, Select } from "@/modules/enquiry/components/Field";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { ApplicationContentEditor } from "../components/ApplicationContentEditor";

const BLANK = {
  title: "",
  application: "",
  projectName: "",
  location: "",
  architect: "",
  description: "",
  /** Phase-1 feedback §6 — blank keeps this off the Projects page. */
  sector: "",
  areaSqFt: "",
};

/** Mirrors PROJECT_SECTORS in application.model.js. */
const SECTORS = [
  { slug: "residential", label: "Residential" },
  { slug: "hospitality", label: "Hospitality" },
  { slug: "commercial", label: "Commercial" },
  { slug: "infrastructure", label: "Infrastructure" },
];

interface ProjectLink {
  label: string;
  url: string;
}

/**
 * Admin Scope §4 — application and project photography.
 *
 * The linkage to stones is the point of the module, not an extra: §4 ends with
 * "these images can be connected to the relevant stone", and it is what lets a
 * customer go from a hotel lobby they like to the lot the floor was cut from.
 */
export function ApplicationListPage() {
  const queryClient = useQueryClient();
  const { taxonomies } = useSiteConfig();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [links, setLinks] = useState<ProjectLink[]>([]);
  /** Phase-2 feedback §3 — Instagram reels, one URL per line. */
  const [instagramUrls, setInstagramUrls] = useState("");
  const [stoneIds, setStoneIds] = useState<Array<{ id: string; name: string; code: string }>>([]);

  const { data } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => (await adminApi.applications({ limit: 60 })).data,
  });

  const { data: editing } = useQuery({
    queryKey: ["admin-application", editingId],
    queryFn: () => adminApi.application(editingId!),
    enabled: Boolean(editingId),
  });

  useEffect(() => {
    if (!editing) return;
    setForm({
      title: editing.title,
      application: editing.application,
      projectName: editing.projectName ?? "",
      location: editing.location ?? "",
      architect: editing.architect ?? "",
      description: editing.description,
      sector: editing.sector ?? "",
      areaSqFt: editing.areaSqFt?.toString() ?? "",
    });
    setImageIds(editing.imageIds);
    setVideoIds(editing.videoIds ?? []);
    setLinks(editing.links ?? []);
    setInstagramUrls((editing.instagramUrls ?? []).join("\n"));
    setStoneIds(
      (editing.stones ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        code: s.mossanoCode,
      })),
    );
  }, [editing]);

  const reset = () => {
    setEditingId(null);
    setForm(BLANK);
    setImageIds([]);
    setVideoIds([]);
    setLinks([]);
    setInstagramUrls("");
    setStoneIds([]);
  };

  const save = useMutation({
    mutationFn: (body: unknown) =>
      editingId ? adminApi.updateApplication(editingId, body) : adminApi.createApplication(body),
    onSuccess: () => {
      toast.success(editingId ? "Saved" : "Project added");
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteApplication(id),
    onSuccess: () => {
      toast.success("Removed");
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
  });

  const projects = data ?? [];

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Project photography, connected to the stone that was used."
      />

      <div className="grid gap-x-12 lg:grid-cols-[1fr_20rem]">
        <section>
          <DataTable
            head={["Project", "Application", "Stones", "Images", ""]}
            empty={
              projects.length === 0 ? (
                <TableEmpty message="No project photography yet. The client has not supplied any." />
              ) : undefined
            }
          >
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-ivory-dark/60">
                <td className="py-3 pr-6">
                  <button
                    type="button"
                    onClick={() => setEditingId(project.id)}
                    className="text-left text-[0.88rem] hover:text-brass"
                  >
                    {project.projectName ?? project.title}
                  </button>
                  {(project.location || project.architect) && (
                    <span className="block text-[0.73rem] text-ink-faint">
                      {[project.architect, project.location].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-6 text-[0.8rem] text-ink-soft">
                  {project.applicationLabel}
                </td>
                <td className="py-3 pr-6 text-[0.8rem] tabular-nums">{project.stoneCount}</td>
                <td className="py-3 pr-6 text-[0.8rem] tabular-nums">{project.images.length}</td>
                <td className="py-3">
                  <div className="flex gap-4">
                    {project.isPublished ? (
                      <Pill tone="brass">Live</Pill>
                    ) : (
                      <Pill tone="muted">Draft</Pill>
                    )}
                    <button
                      type="button"
                      onClick={() => remove.mutate(project.id)}
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
            <p className="label">{editingId ? "Edit project" : "Add a project"}</p>
            {editingId && (
              <button type="button" onClick={reset} className="label hover:text-ink">
                New instead
              </button>
            )}
          </div>

          <div className="mt-5">
            <Field label="Application" htmlFor="application" required>
              <Select
                id="application"
                value={form.application}
                onChange={(e) => setForm({ ...form, application: e.target.value })}
              >
                <option value="">Choose one</option>
                {(taxonomies?.applications ?? []).map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Title" htmlFor="app-title" required>
              <TextInput
                id="app-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Project name" htmlFor="app-project">
              <TextInput
                id="app-project"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              />
            </Field>
            <Field label="Architect" htmlFor="app-architect">
              <TextInput
                id="app-architect"
                value={form.architect}
                onChange={(e) => setForm({ ...form, architect: e.target.value })}
              />
            </Field>
            <Field label="Location" htmlFor="app-location">
              <TextInput
                id="app-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
            <Field label="Description" htmlFor="app-description">
              <TextArea
                id="app-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>

            {/* Phase-1 feedback §6 — what puts a record on /projects. Leave
                the sector blank and it stays an ordinary application photo. */}
            <Field
              label="Landmark sector"
              htmlFor="app-sector"
              hint="Set this to list the project on the Projects page"
            >
              <Select
                id="app-sector"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              >
                <option value="">Not a landmark project</option>
                {SECTORS.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Area (sq ft)" htmlFor="app-area" hint="Orders the Projects page">
              <TextInput
                id="app-area"
                type="number"
                min={0}
                value={form.areaSqFt}
                onChange={(e) => setForm({ ...form, areaSqFt: e.target.value })}
              />
            </Field>

            <MediaPicker
              kind="application"
              label="Project photography"
              value={imageIds}
              onChange={setImageIds}
              max={30}
            />

            <MediaPicker
              kind="video"
              label="Project video"
              value={videoIds}
              onChange={setVideoIds}
              max={12}
            />

            {/* Phase-2 feedback §3. A textarea rather than a repeating row:
                the team pastes these straight from Instagram, several at a
                time, and one per line is the shape that arrives. */}
            <Field
              label="Instagram videos"
              htmlFor="app-instagram"
              hint="One URL per line — a post or reel link"
            >
              <TextArea
                id="app-instagram"
                rows={3}
                placeholder="https://www.instagram.com/reel/…"
                value={instagramUrls}
                onChange={(e) => setInstagramUrls(e.target.value)}
              />
            </Field>

            <div className="mt-8">
              <p className="label mb-3">Entry links</p>
              {links.map((link, i) => (
                <div key={i} className="mb-2 flex items-start gap-2">
                  <TextInput
                    aria-label={`Link ${i + 1} label`}
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) =>
                      setLinks(links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))
                    }
                  />
                  <TextInput
                    aria-label={`Link ${i + 1} URL`}
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) =>
                      setLinks(links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, j) => j !== i))}
                    className="mt-2 shrink-0 text-ink-faint hover:text-ink"
                    aria-label={`Remove link ${i + 1}`}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.4} />
                  </button>
                </div>
              ))}
              {links.length < 8 && (
                <button
                  type="button"
                  onClick={() => setLinks([...links, { label: "", url: "" }])}
                  className="label underline-offset-4 hover:underline"
                >
                  Add a link
                </button>
              )}
            </div>

            <div className="mt-8">
              <p className="label mb-3">Stone used</p>
              <StonePicker
                selectedIds={stoneIds.map((s) => s.id)}
                onAdd={(stone) =>
                  setStoneIds((prev) => [
                    ...prev,
                    { id: stone.id, name: stone.name, code: stone.mossanoCode },
                  ])
                }
              />
              {stoneIds.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {stoneIds.map((stone) => (
                    <li
                      key={stone.id}
                      className="flex items-center justify-between gap-2 text-[0.8rem]"
                    >
                      <span className="truncate">
                        {stone.code} {stone.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStoneIds((prev) => prev.filter((s) => s.id !== stone.id))}
                        className="text-ink-faint hover:text-ink"
                        aria-label={`Remove ${stone.name}`}
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.4} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              className="btn-solid mt-8 w-full"
              disabled={save.isPending || !form.title || !form.application}
              onClick={() =>
                save.mutate({
                  ...form,
                  projectName: form.projectName || undefined,
                  location: form.location || undefined,
                  architect: form.architect || undefined,
                  description: form.description || undefined,
                  sector: form.sector || undefined,
                  areaSqFt: form.areaSqFt.trim() === "" ? undefined : Number(form.areaSqFt),
                  imageIds,
                  videoIds,
                  instagramUrls: instagramUrls
                    .split("\n")
                    .map((u) => u.trim())
                    .filter(Boolean),
                  // A half-typed row must not fail the whole save on the URL rule.
                  links: links.filter((l) => l.label.trim() && l.url.trim()),
                  stoneIds: stoneIds.map((s) => s.id),
                })
              }
            >
              {save.isPending ? "Saving…" : editingId ? "Save project" : "Add project"}
            </button>
          </div>

          {/* Phase-2 feedback §5 — the application pages themselves, which are
              not projects and are edited separately. */}
          <div className="mt-10">
            <ApplicationContentEditor />
          </div>
        </aside>
      </div>
    </>
  );
}
