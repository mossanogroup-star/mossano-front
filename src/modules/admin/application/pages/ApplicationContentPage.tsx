import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { PageHeader } from "../../components/AdminUi";
import { useSession } from "../../auth/useSession";
import { Field, TextInput } from "@/modules/enquiry/components/Field";
import { ApplicationContentEditor } from "../components/ApplicationContentEditor";

/**
 * Phase-3 feedback — the Shop by Application pages, on their own tab. Projects
 * are edited under Project Images and Project Videos, never here.
 */
export function ApplicationContentPage() {
  const queryClient = useQueryClient();
  const isAdmin = useSession().user?.role === "admin";
  const [label, setLabel] = useState("");

  const { data: rows } = useQuery({
    queryKey: ["admin-application-content"],
    queryFn: () => adminApi.applicationContent(),
  });
  const added = (rows ?? []).filter((r) => r.builtIn === false);

  // The taxonomy lives in the site config, so both lists are refreshed.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["config"] });
    queryClient.invalidateQueries({ queryKey: ["admin-application-content"] });
  };

  const create = useMutation({
    mutationFn: (name: string) => adminApi.createApplicationCategory(name),
    onSuccess: (category) => {
      toast.success(`${category.label} added`);
      setLabel("");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not add"),
  });

  const remove = useMutation({
    mutationFn: (slug: string) => adminApi.deleteApplicationCategory(slug),
    onSuccess: () => {
      toast.success("Removed");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not remove"),
  });

  return (
    <>
      <PageHeader title="Applications" subtitle="The images and copy on Shop by Application." />

      <div className="grid max-w-5xl gap-x-12 gap-y-10 lg:grid-cols-[1fr_20rem]">
        <ApplicationContentEditor />

        <aside>
          <form
            className="border border-ivory-dark p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (label.trim()) create.mutate(label.trim());
            }}
          >
            <p className="label">Add a new application</p>
            <Field label="Name" htmlFor="new-application" hint="e.g. Staircase">
              <TextInput
                id="new-application"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </Field>
            <button
              type="submit"
              className="btn-solid w-full"
              disabled={create.isPending || label.trim().length < 2}
            >
              {create.isPending ? "Adding…" : "Add application"}
            </button>
          </form>

          {added.length > 0 && (
            <div className="mt-8">
              <p className="label mb-3">Added by the team</p>
              <ul className="divide-y divide-ivory-dark border-y border-ivory-dark">
                {added.map((row) => (
                  <li
                    key={row.application}
                    className="flex items-center justify-between gap-4 py-2.5 text-[0.85rem]"
                  >
                    {row.label}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${row.label}?`))
                            remove.mutate(row.application);
                        }}
                        disabled={remove.isPending}
                        className="label hover:text-[#b23b2e] disabled:opacity-40"
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
