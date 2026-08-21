import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import {
  PageHeader,
  DataTable,
  TableEmpty,
  Pill,
} from "../../components/AdminUi";
import { Field, TextInput, Select } from "@/modules/enquiry/components/Field";
import { useSession } from "../../auth/useSession";
import type { Role } from "@/shared/api/types";

const ROLES: Array<{ value: Role; label: string; hint: string }> = [
  {
    value: "admin",
    label: "Admin",
    hint: "Everything, including team accounts",
  },
  {
    value: "editor",
    label: "Editor",
    hint: "Stones, Edits, enquiries and selections",
  },
  { value: "viewer", label: "Viewer", hint: "Read only" },
];

/** Team accounts. Admin-only end to end — an editor never sees this screen. */
export function TeamPage() {
  const queryClient = useQueryClient();
  const { user: me } = useSession();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "editor" as Role,
  });

  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await adminApi.users()).data,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  const create = useMutation({
    mutationFn: (body: unknown) => adminApi.createUser(body),
    onSuccess: (user) => {
      toast.success(`${user.name} added`);
      setForm({ name: "", email: "", password: "", role: "editor" });
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not add"),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      adminApi.updateUser(id, body),
    onSuccess: () => {
      toast.success("Updated");
      invalidate();
    },
    // The server refuses to demote or disable the last active admin; surfacing
    // its message is more useful than a generic failure.
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not update"),
  });

  const users = data ?? [];

  return (
    <>
      <PageHeader title="Team" subtitle="Who can sign in to the admin panel." />

      <div className="grid gap-x-12 lg:grid-cols-[1fr_20rem]">
        <DataTable
          head={["Name", "Email", "Role", "Active", "Last signed in"]}
          empty={
            users.length === 0 ? (
              <TableEmpty message="No team members." />
            ) : undefined
          }
        >
          {users.map((user) => (
            <tr key={user.id} className="border-b border-ivory-dark/60">
              <td className="py-3 pr-6 text-[0.88rem]">
                {user.name}
                {user.id === me?.id && (
                  <span className="ml-2">
                    <Pill tone="muted">You</Pill>
                  </span>
                )}
              </td>
              <td className="py-3 pr-6 text-[0.8rem] text-ink-soft">
                {user.email}
              </td>
              <td className="py-3 pr-6">
                <select
                  value={user.role}
                  onChange={(e) =>
                    update.mutate({
                      id: user.id,
                      body: { role: e.target.value },
                    })
                  }
                  className="border-0 border-b border-transparent bg-transparent py-0.5 pr-5 text-[0.8rem] hover:border-ink/30 focus:border-ink focus:outline-none"
                  aria-label={`Role of ${user.name}`}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 pr-6">
                <button
                  type="button"
                  onClick={() =>
                    update.mutate({
                      id: user.id,
                      body: { isActive: !user.isActive },
                    })
                  }
                  disabled={user.id === me?.id}
                  className="disabled:opacity-40"
                  title={
                    user.id === me?.id
                      ? "You cannot disable your own account"
                      : undefined
                  }
                >
                  {user.isActive ? (
                    <Pill tone="brass">Active</Pill>
                  ) : (
                    <Pill tone="muted">Disabled</Pill>
                  )}
                </button>
              </td>
              <td className="py-3 text-[0.76rem] text-ink-faint">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString("en-IN")
                  : "Never"}
              </td>
            </tr>
          ))}
        </DataTable>

        <aside className="mt-12 border-t border-ivory-dark pt-8 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="label">Add a team member</p>

          <div className="mt-5">
            <Field label="Name" htmlFor="u-name" required>
              <TextInput
                id="u-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Email" htmlFor="u-email" required>
              <TextInput
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field
              label="Password"
              htmlFor="u-password"
              required
              hint="At least 10 characters, with a letter and a number"
            >
              <TextInput
                id="u-password"
                type="text"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            <Field
              label="Role"
              htmlFor="u-role"
              hint={ROLES.find((r) => r.value === form.role)?.hint}
            >
              <Select
                id="u-role"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as Role })
                }
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>

            <button
              type="button"
              className="btn-solid w-full"
              disabled={
                create.isPending ||
                !form.name ||
                !form.email ||
                form.password.length < 10
              }
              onClick={() => create.mutate(form)}
            >
              {create.isPending ? "Adding…" : "Add"}
            </button>

            {/* Shown in plain text on purpose: there is no invitation email in
                Phase 1, so the person adding the account has to be able to read
                the password and pass it on. */}
            <p className="mt-4 text-[0.75rem] leading-relaxed text-ink-faint">
              There is no invitation email yet — give them this password
              directly and have them change it after signing in.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
