import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Copy, Link2Off, RotateCcw } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import {
  PageHeader,
  DataTable,
  TableEmpty,
  Pill,
} from "../../components/AdminUi";

/**
 * Admin Scope §6 — private selections.
 *
 * The engagement columns matter more than they look: a selection sent a week
 * ago with zero views is a follow-up call, and there is no other way for the
 * team to know.
 */
export function SelectionListPage() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-selections"],
    queryFn: async () =>
      (await adminApi.selections({ includeRevoked: true, limit: 60 })).data,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-selections"] });

  const revoke = useMutation({
    mutationFn: (id: string) => adminApi.revokeSelection(id),
    onSuccess: () => {
      toast.success("Link revoked — the customer can no longer open it");
      invalidate();
    },
  });

  const restore = useMutation({
    mutationFn: (id: string) => adminApi.restoreSelection(id),
    onSuccess: () => {
      toast.success("Link restored");
      invalidate();
    },
  });

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      // Clipboard access is denied in some in-app browsers; showing the URL is
      // better than a silent failure the team cannot work around.
      toast.info(url, { duration: 15000 });
    }
  };

  const selections = data ?? [];

  return (
    <>
      <PageHeader
        title="Private Selections"
        subtitle="Curated sets shared with one customer by link."
        actions={
          <Link to="/admin/selections/new" className="btn-solid">
            New selection
          </Link>
        }
      />

      <DataTable
        head={[
          "Ref",
          "Prepared for",
          "Stones",
          "Status",
          "Views",
          "Last opened",
          "",
        ]}
        empty={
          selections.length === 0 ? (
            <TableEmpty message="No selections yet." />
          ) : undefined
        }
      >
        {selections.map((selection) => (
          <tr key={selection.id} className="border-b border-ivory-dark/60">
            <td className="py-3 pr-6 text-[0.76rem] tabular-nums text-ink-faint">
              {selection.reference}
            </td>
            <td className="py-3 pr-6">
              <Link
                to={`/admin/selections/${selection.id}`}
                className="text-[0.88rem] hover:text-brass"
              >
                {selection.customerName}
              </Link>
              <span className="block text-[0.73rem] text-ink-faint">
                {selection.projectName ?? selection.title}
              </span>
            </td>
            <td className="py-3 pr-6 text-[0.8rem] tabular-nums text-ink-soft">
              {selection.stoneCount}
            </td>
            <td className="py-3 pr-6">
              {selection.isRevoked ? (
                <Pill tone="muted">Revoked</Pill>
              ) : selection.isExpired ? (
                <Pill tone="muted">Expired</Pill>
              ) : selection.isPublished ? (
                <Pill tone="brass">Shared</Pill>
              ) : (
                <Pill tone="muted">Draft</Pill>
              )}
            </td>
            <td className="py-3 pr-6 text-[0.8rem] tabular-nums text-ink-soft">
              {selection.viewCount}
            </td>
            <td className="py-3 pr-6 text-[0.76rem] text-ink-faint">
              {selection.lastViewedAt
                ? new Date(selection.lastViewedAt).toLocaleDateString("en-IN")
                : "Not yet"}
            </td>
            <td className="py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => copy(selection.url)}
                  className="text-ink-faint transition-colors hover:text-ink"
                  aria-label={`Copy the link for ${selection.customerName}`}
                >
                  <Copy className="h-4 w-4" strokeWidth={1.3} />
                </button>
                {selection.isRevoked ? (
                  <button
                    type="button"
                    onClick={() => restore.mutate(selection.id)}
                    className="text-ink-faint transition-colors hover:text-ink"
                    aria-label="Restore the link"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={1.3} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => revoke.mutate(selection.id)}
                    className="text-ink-faint transition-colors hover:text-[#b23b2e]"
                    aria-label="Revoke the link"
                  >
                    <Link2Off className="h-4 w-4" strokeWidth={1.3} />
                  </button>
                )}
                <a
                  href={selection.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label underline-offset-4 hover:text-ink hover:underline"
                >
                  PDF
                </a>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
