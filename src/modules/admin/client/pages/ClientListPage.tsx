import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { PageHeader, DataTable, TableEmpty, Pill } from "../../components/AdminUi";
import { MediaPicker } from "../../media/components/MediaPicker";
import { Field, TextInput, Select } from "@/modules/enquiry/components/Field";
import { ApiError } from "@/shared/api/http";

const BLANK_CATEGORY = { name: "", sortOrder: "0" };
const BLANK_CLIENT = { name: "", category: "", website: "", sortOrder: "0" };

/**
 * Phase-2 feedback §1 and §2 — the CRM behind the Clients page and the home
 * carousel.
 *
 * Both lists live on one screen because they are edited together: a new client
 * usually arrives with a new category, and bouncing between two pages to add
 * "Automobiles" and then BMW is the kind of friction that ends with logos being
 * emailed to a developer instead.
 */
export function ClientListPage() {
  const queryClient = useQueryClient();

  const [category, setCategory] = useState(BLANK_CATEGORY);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [client, setClient] = useState(BLANK_CLIENT);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [logoIds, setLogoIds] = useState<string[]>([]);

  const { data: categories } = useQuery({
    queryKey: ["admin-client-categories"],
    queryFn: () => adminApi.clientCategories(),
  });

  const { data: clients } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => adminApi.clients(),
  });

  // Default the picker to the first category so adding a client is two fields
  // rather than three.
  useEffect(() => {
    if (!client.category && categories?.length) {
      setClient((c) => ({ ...c, category: categories[0].id }));
    }
  }, [categories, client.category]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-client-categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
  };

  const fail = (err: unknown) =>
    toast.error(err instanceof ApiError ? err.message : "Something went wrong");

  const saveCategory = useMutation({
    mutationFn: (body: unknown) =>
      editingCategoryId
        ? adminApi.updateClientCategory(editingCategoryId, body)
        : adminApi.createClientCategory(body),
    onSuccess: () => {
      toast.success(editingCategoryId ? "Category saved" : "Category added");
      setCategory(BLANK_CATEGORY);
      setEditingCategoryId(null);
      refresh();
    },
    onError: fail,
  });

  const removeCategory = useMutation({
    mutationFn: (id: string) => adminApi.deleteClientCategory(id),
    onSuccess: () => {
      toast.success("Category removed");
      refresh();
    },
    // The server refuses a category that still holds clients, and says how
    // many — surface that rather than a generic failure.
    onError: fail,
  });

  const saveClient = useMutation({
    mutationFn: (body: unknown) =>
      editingClientId ? adminApi.updateClient(editingClientId, body) : adminApi.createClient(body),
    onSuccess: () => {
      toast.success(editingClientId ? "Client saved" : "Client added");
      setClient({ ...BLANK_CLIENT, category: client.category });
      setLogoIds([]);
      setEditingClientId(null);
      refresh();
    },
    onError: fail,
  });

  const removeClient = useMutation({
    mutationFn: (id: string) => adminApi.deleteClient(id),
    onSuccess: () => {
      toast.success("Client removed");
      refresh();
    },
    onError: fail,
  });

  const byCategory = (id: string) => categories?.find((c) => c.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="The Clients page, and the logo strip on the home page."
      />

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-12">
          <section>
            <p className="label mb-4">Categories</p>
            <DataTable
              head={["Category", "Clients", "Order", "", ""]}
              empty={
                categories?.length === 0 ? <TableEmpty message="No categories yet." /> : undefined
              }
            >
              {(categories ?? []).map((c) => (
                <tr key={c.id} className="border-b border-ivory-dark/60 align-middle">
                  <td className="py-2.5 pr-6">{c.name}</td>
                  <td className="py-2.5 pr-6 tabular-nums">{c.clientCount}</td>
                  <td className="py-2.5 pr-6 tabular-nums">{c.sortOrder}</td>
                  <td className="py-2.5 pr-6">
                    <Pill tone={c.isPublished ? "brass" : "muted"}>
                      {c.isPublished ? "Live" : "Hidden"}
                    </Pill>
                  </td>
                  <td className="py-2.5">
                    <span className="flex gap-3">
                      <button
                        type="button"
                        className="label underline-offset-4 hover:underline"
                        onClick={() => {
                          setEditingCategoryId(c.id);
                          setCategory({ name: c.name, sortOrder: String(c.sortOrder) });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="label text-ink-faint underline-offset-4 hover:text-ink hover:underline"
                        onClick={() => removeCategory.mutate(c.id)}
                      >
                        Remove
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          </section>

          <section>
            <p className="label mb-4">Clients</p>
            <DataTable
              head={["Client", "Category", "Logo", "Order", ""]}
              empty={clients?.length === 0 ? <TableEmpty message="No clients yet." /> : undefined}
            >
              {(clients ?? []).map((c) => (
                <tr key={c.id} className="border-b border-ivory-dark/60 align-middle">
                  <td className="py-2.5 pr-6">{c.name}</td>
                  <td className="py-2.5 pr-6">{byCategory(c.categoryId ?? "")}</td>
                  <td className="py-2.5 pr-6">
                    {c.logo ? (
                      <img
                        src={c.logo.thumbnailUrl ?? c.logo.url}
                        alt=""
                        className="h-6 w-auto max-w-20 object-contain"
                      />
                    ) : (
                      <span className="text-ink-faint">none</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-6 tabular-nums">{c.sortOrder}</td>
                  <td className="py-2.5">
                    <span className="flex gap-3">
                      <button
                        type="button"
                        className="label underline-offset-4 hover:underline"
                        onClick={() => {
                          setEditingClientId(c.id);
                          setClient({
                            name: c.name,
                            category: c.categoryId ?? "",
                            website: c.website ?? "",
                            sortOrder: String(c.sortOrder),
                          });
                          setLogoIds(c.logoId ? [c.logoId] : []);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="label text-ink-faint underline-offset-4 hover:text-ink hover:underline"
                        onClick={() => removeClient.mutate(c.id)}
                      >
                        Remove
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          </section>
        </div>

        <aside className="space-y-10">
          <div className="border border-ivory-dark p-6">
            <div className="flex items-center justify-between">
              <p className="label">{editingCategoryId ? "Edit category" : "Add a category"}</p>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setCategory(BLANK_CATEGORY);
                  }}
                  aria-label="Cancel"
                  className="text-ink-faint hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.4} />
                </button>
              )}
            </div>

            <Field label="Name" htmlFor="cat-name">
              <TextInput
                id="cat-name"
                placeholder="Hotels"
                value={category.name}
                onChange={(e) => setCategory({ ...category, name: e.target.value })}
              />
            </Field>
            <Field label="Order" htmlFor="cat-order" hint="Lowest first">
              <TextInput
                id="cat-order"
                type="number"
                min={0}
                value={category.sortOrder}
                onChange={(e) => setCategory({ ...category, sortOrder: e.target.value })}
              />
            </Field>

            <button
              type="button"
              className="btn-solid mt-6 w-full"
              disabled={saveCategory.isPending || !category.name.trim()}
              onClick={() =>
                saveCategory.mutate({
                  name: category.name.trim(),
                  sortOrder: Number(category.sortOrder) || 0,
                })
              }
            >
              {saveCategory.isPending ? "Saving…" : editingCategoryId ? "Save" : "Add category"}
            </button>
          </div>

          <div className="border border-ivory-dark p-6">
            <div className="flex items-center justify-between">
              <p className="label">{editingClientId ? "Edit client" : "Add a client"}</p>
              {editingClientId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingClientId(null);
                    setClient({ ...BLANK_CLIENT, category: client.category });
                    setLogoIds([]);
                  }}
                  aria-label="Cancel"
                  className="text-ink-faint hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.4} />
                </button>
              )}
            </div>

            <Field label="Name" htmlFor="cl-name">
              <TextInput
                id="cl-name"
                placeholder="Taj Hotels"
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
              />
            </Field>

            <Field label="Category" htmlFor="cl-category">
              <Select
                id="cl-category"
                value={client.category}
                onChange={(e) => setClient({ ...client, category: e.target.value })}
              >
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Website" htmlFor="cl-website" hint="Optional — the logo links to it">
              <TextInput
                id="cl-website"
                placeholder="https://…"
                value={client.website}
                onChange={(e) => setClient({ ...client, website: e.target.value })}
              />
            </Field>

            <Field label="Order" htmlFor="cl-order" hint="Lowest first, within the category">
              <TextInput
                id="cl-order"
                type="number"
                min={0}
                value={client.sortOrder}
                onChange={(e) => setClient({ ...client, sortOrder: e.target.value })}
              />
            </Field>

            {/* One logo. The picker handles many, so the first is taken. */}
            <MediaPicker
              kind="general"
              label="Logo"
              value={logoIds}
              onChange={(ids) => setLogoIds(ids.slice(-1))}
              max={1}
            />

            <button
              type="button"
              className="btn-solid mt-6 w-full"
              disabled={saveClient.isPending || !client.name.trim() || !client.category}
              onClick={() =>
                saveClient.mutate({
                  name: client.name.trim(),
                  category: client.category,
                  website: client.website.trim() || undefined,
                  sortOrder: Number(client.sortOrder) || 0,
                  logo: logoIds[0],
                })
              }
            >
              {saveClient.isPending ? "Saving…" : editingClientId ? "Save" : "Add client"}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
