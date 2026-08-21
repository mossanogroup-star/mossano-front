import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Copy } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { PageHeader, Pill } from "../../components/AdminUi";
import { StonePicker } from "../../components/StonePicker";
import { MediaPicker } from "../../media/components/MediaPicker";
import { Field, TextInput, TextArea } from "@/modules/enquiry/components/Field";

interface Item {
  stoneId: string;
  note: string;
  name: string;
  code: string;
  imageUrl: string | null;
}

/**
 * Build a private selection — Admin Scope §6.
 *
 * Stones are added by reference from the existing catalogue ("no need to upload
 * the same stone again"), each with an optional note explaining why that lot
 * for this project. The link is only issued once the team marks it shared, so a
 * half-built selection is never reachable.
 */
export function SelectionEditPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search] = useSearchParams();

  const { data: selection } = useQuery({
    queryKey: ["admin-selection", id],
    queryFn: () => adminApi.selection(id!),
    enabled: !isNew,
  });

  const [form, setForm] = useState({
    title: "",
    customerName: "",
    projectName: "",
    customerEmail: "",
    customerPhone: "",
    introduction: "",
    isPublished: false,
  });
  const [items, setItems] = useState<Item[]>([]);
  const [imageIds, setImageIds] = useState<string[]>([]);

  useEffect(() => {
    if (!selection) return;
    setForm({
      title: selection.title,
      customerName: selection.customerName,
      projectName: selection.projectName ?? "",
      customerEmail: selection.customerEmail ?? "",
      customerPhone: selection.customerPhone ?? "",
      introduction: selection.introduction,
      isPublished: selection.isPublished,
    });
    setImageIds(selection.imageIds);
    setItems(
      (selection.stones ?? []).map((stone) => ({
        stoneId: stone.id,
        note:
          selection.items.find((i) => i.stoneId === stone.id)?.note ?? stone.selectionNote ?? "",
        name: stone.name,
        code: stone.mossanoCode,
        imageUrl: stone.primaryImageUrl,
      })),
    );
  }, [selection]);

  const save = useMutation({
    mutationFn: (body: unknown) =>
      isNew ? adminApi.createSelection(body) : adminApi.updateSelection(id!, body),
    onSuccess: (saved) => {
      toast.success(isNew ? `Selection ${saved.reference} created` : "Saved");
      queryClient.invalidateQueries({ queryKey: ["admin-selections"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-selection", saved.id],
      });
      if (isNew) navigate(`/admin/selections/${saved.id}`, { replace: true });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });

  const regenerate = useMutation({
    mutationFn: () => adminApi.regenerateSelectionLink(id!),
    onSuccess: () => {
      toast.success("New link issued — the previous one no longer works");
      queryClient.invalidateQueries({ queryKey: ["admin-selection", id] });
    },
  });

  const submit = () =>
    save.mutate({
      ...form,
      projectName: form.projectName || undefined,
      customerEmail: form.customerEmail || undefined,
      customerPhone: form.customerPhone || undefined,
      introduction: form.introduction || undefined,
      // Sent as annotated items, so the per-stone note travels with the stone
      // and stays in the curated order.
      items: items.map(({ stoneId, note }) => ({
        stone: stoneId,
        note: note || undefined,
      })),
      imageIds,
      sourceEnquiry: search.get("enquiry") ?? undefined,
    });

  return (
    <>
      <PageHeader
        title={isNew ? "New private selection" : (selection?.customerName ?? "Selection")}
        subtitle={
          isNew
            ? "Pick stones from the catalogue and share a private link."
            : `${selection?.reference} · ${selection?.viewCount ?? 0} view${selection?.viewCount === 1 ? "" : "s"}`
        }
        actions={
          <>
            <Link to="/admin/selections" className="btn-outline">
              Back
            </Link>
            <button type="button" className="btn-solid" onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </button>
          </>
        }
      />

      {!isNew && selection && (
        <div className="mb-10 flex flex-wrap items-center gap-4 border border-ivory-dark p-4">
          <code className="min-w-0 flex-1 truncate text-[0.8rem] text-ink-soft">
            {selection.url}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(selection.url)}
            className="inline-flex items-center gap-2 label hover:text-ink"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={1.3} />
            Copy
          </button>
          <a
            href={selection.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="label hover:text-ink"
          >
            PDF
          </a>
          <button
            type="button"
            onClick={() => regenerate.mutate()}
            className="label hover:text-ink"
            disabled={regenerate.isPending}
          >
            New link
          </button>
          {selection.isRevoked && <Pill tone="muted">Revoked</Pill>}
          {selection.expiresAt && (
            <Pill tone="muted">
              Expires {new Date(selection.expiresAt).toLocaleDateString("en-IN")}
            </Pill>
          )}
        </div>
      )}

      <div className="grid gap-x-12 lg:grid-cols-2">
        <section>
          <p className="label mb-5">Who it is for</p>
          <Field label="Prepared for" htmlFor="customerName" required hint="e.g. XYZ Architects">
            <TextInput
              id="customerName"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </Field>
          <Field label="Project" htmlFor="projectName" hint="e.g. Mumbai Residence">
            <TextInput
              id="projectName"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
            />
          </Field>
          <Field label="Selection title" htmlFor="title" required>
            <TextInput
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="A selection for the Mumbai Residence"
            />
          </Field>

          <div className="grid gap-x-6 sm:grid-cols-2">
            <Field label="Their email" htmlFor="customerEmail">
              <TextInput
                id="customerEmail"
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              />
            </Field>
            <Field label="Their phone" htmlFor="customerPhone">
              <TextInput
                id="customerPhone"
                type="tel"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Introduction" htmlFor="introduction" hint="Shown at the top of their page">
            <TextArea
              id="introduction"
              value={form.introduction}
              onChange={(e) => setForm({ ...form, introduction: e.target.value })}
            />
          </Field>

          {/* Nothing is reachable until this is on, so a half-built selection
              can never be opened by a customer who was sent the link early. */}
          <label className="mt-2 flex items-start gap-3 border border-ink/15 p-4 text-[0.85rem]">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="mt-1 h-3.5 w-3.5 shrink-0 appearance-none border border-ink/30 checked:border-ink checked:bg-ink"
            />
            <span>
              Share this selection
              <span className="mt-1 block text-[0.78rem] text-ink-faint">
                Until this is on, the link returns "not available yet".
              </span>
            </span>
          </label>

          <div className="mt-10">
            <MediaPicker
              kind="selection"
              label="Reference photos"
              hint="Optional — mood images or previous work to sit alongside the stones."
              value={imageIds}
              onChange={setImageIds}
              max={20}
            />
          </div>
        </section>

        <section>
          <p className="label mb-5">Stones in this selection</p>

          <StonePicker
            selectedIds={items.map((i) => i.stoneId)}
            onAdd={(stone) =>
              setItems((prev) => [
                ...prev,
                {
                  stoneId: stone.id,
                  note: "",
                  name: stone.name,
                  code: stone.mossanoCode,
                  imageUrl: stone.primaryImageUrl,
                },
              ])
            }
          />

          {items.length ? (
            <ul className="mt-6 space-y-5">
              {items.map((item, i) => (
                <li key={item.stoneId} className="border border-ivory-dark p-4">
                  <div className="flex items-center gap-3">
                    <span className="label w-6 shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="slab-frame h-10 w-14 shrink-0">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.88rem]">{item.name}</span>
                      <span className="text-[0.72rem] text-ink-faint">{item.code}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setItems((prev) => prev.filter((x) => x.stoneId !== item.stoneId))
                      }
                      className="shrink-0 text-ink-faint hover:text-ink"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="h-4 w-4" strokeWidth={1.4} />
                    </button>
                  </div>

                  {/* Why this lot, for this project. The single thing that makes
                      a selection feel curated rather than filtered. */}
                  <TextArea
                    className="mt-3"
                    rows={2}
                    value={item.note}
                    placeholder="Why this lot for this project…"
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) =>
                          x.stoneId === item.stoneId ? { ...x, note: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 border border-ivory-dark py-10 text-center text-[0.85rem] text-ink-faint">
              No stones yet. Search above to add them.
            </p>
          )}
        </section>
      </div>

      <div className="mt-12 flex justify-end gap-3 border-t border-ivory-dark pt-8">
        <Link to="/admin/selections" className="btn-outline">
          Cancel
        </Link>
        <button type="button" className="btn-solid" onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save selection"}
        </button>
      </div>
    </>
  );
}
