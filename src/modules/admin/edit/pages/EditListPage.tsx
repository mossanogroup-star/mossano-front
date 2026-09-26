import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { PageHeader, DataTable, TableEmpty, Pill } from "../../components/AdminUi";
import { Field, TextInput } from "@/modules/enquiry/components/Field";
import type { EditStatus } from "@/shared/api/types";
import { useSession } from "../../auth/useSession";

const STATUSES: Array<{ value: EditStatus; label: string }> = [
  { value: "current", label: "Current" },
  { value: "next", label: "Next" },
  { value: "upcoming", label: "Upcoming" },
  { value: "archived", label: "Archived" },
];

/**
 * Admin Scope §3 — the monthly ladder.
 *
 * The example in the document is August → Current, September → Next, October →
 * Upcoming, and each month everything moves up one. Setting a status here also
 * demotes whichever Edit held it before, so the site never shows two Current
 * Edits or none — doing it as three separate edits leaves exactly that gap.
 */
export function EditListPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-edits"],
    queryFn: async () => (await adminApi.edits({ includeArchived: true, limit: 60 })).data,
  });

  const create = useMutation({
    mutationFn: (body: unknown) => adminApi.createEdit(body),
    onSuccess: (edit) => {
      toast.success(`${edit.title} created as a draft`);
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["admin-edits"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not create"),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EditStatus }) =>
      adminApi.setEditStatus(id, status),
    onSuccess: (edit) => {
      toast.success(`${edit.title} is now ${edit.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-edits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update"),
  });

  const publish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      adminApi.updateEdit(id, { isPublished }),
    onSuccess: (edit) => {
      toast.success(edit.isPublished ? `${edit.title} is live` : `${edit.title} hidden`);
      queryClient.invalidateQueries({ queryKey: ["admin-edits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const isAdmin = useSession().user?.role === "admin";
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteEdit(id),
    onSuccess: () => {
      toast.success("Edit removed");
      queryClient.invalidateQueries({ queryKey: ["admin-edits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not remove"),
  });

  const edits = data ?? [];

  return (
    <>
      <PageHeader
        title="Edits"
        subtitle="MOSSANO's curated collections. One Edit at a time can be Current, Next or Upcoming."
      />

      <form
        className="mb-10 flex flex-wrap items-end gap-4 border border-ivory-dark p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate({ title: title.trim() });
        }}
      >
        <Field
          label="New Edit"
          htmlFor="edit-title"
          className="min-w-[16rem] flex-1"
          hint="e.g. September 2026"
        >
          <TextInput
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="September 2026"
          />
        </Field>
        <button
          type="submit"
          className="btn-solid mb-6"
          disabled={create.isPending || !title.trim()}
        >
          {create.isPending ? "Creating…" : "Create"}
        </button>
      </form>

      <DataTable
        head={["Edit", "Status", "Stones", "On the site", ""]}
        empty={edits.length === 0 ? <TableEmpty message="No Edits yet." /> : undefined}
      >
        {edits.map((edit) => (
          <tr key={edit.id} className="border-b border-ivory-dark/60">
            <td className="py-3 pr-6">
              <Link to={`/admin/edits/${edit.id}`} className="text-[0.9rem] hover:text-brass">
                {edit.title}
              </Link>
              {edit.subtitle && (
                <span className="block text-[0.75rem] text-ink-faint">{edit.subtitle}</span>
              )}
            </td>
            <td className="py-3 pr-6">
              <select
                value={edit.status}
                onChange={(e) =>
                  setStatus.mutate({
                    id: edit.id,
                    status: e.target.value as EditStatus,
                  })
                }
                disabled={setStatus.isPending}
                className="border-0 border-b border-transparent bg-transparent py-0.5 pr-5 text-[0.8rem] hover:border-ink/30 focus:border-ink focus:outline-none"
                aria-label={`Status of ${edit.title}`}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </td>
            <td className="py-3 pr-6 text-[0.8rem] tabular-nums text-ink-soft">
              {edit.stoneCount}
            </td>
            <td className="py-3 pr-6">
              <button
                type="button"
                onClick={() =>
                  publish.mutate({
                    id: edit.id,
                    isPublished: !edit.isPublished,
                  })
                }
                disabled={publish.isPending}
                title={edit.isPublished ? "Click to hide from the site" : "Click to publish"}
                className="group inline-flex items-center gap-2 disabled:opacity-40"
              >
                {edit.isPublished ? (
                  <Pill tone="brass">Live</Pill>
                ) : (
                  <Pill tone="muted">Draft</Pill>
                )}
                <span className="font-sans text-[0.6rem] uppercase tracking-label text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                  {edit.isPublished ? "Hide" : "Publish"}
                </span>
              </button>
            </td>
            <td className="py-3">
              <div className="flex gap-4">
                <Link
                  to={`/admin/edits/${edit.id}`}
                  className="label underline-offset-4 hover:underline"
                >
                  Manage stones
                </Link>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove the Edit "${edit.title}"?`))
                        remove.mutate(edit.id);
                    }}
                    disabled={remove.isPending}
                    className="label hover:text-[#b23b2e] disabled:opacity-40"
                  >
                    Delete
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
