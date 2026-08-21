import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import {
  PageHeader,
  DataTable,
  TableEmpty,
  AvailabilitySelect,
  Pill,
} from "../../components/AdminUi";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import type { Availability } from "@/shared/api/types";

/**
 * The catalogue.
 *
 * Availability is changed in the row rather than behind a form, because Admin
 * Scope §2 is the action the team performs constantly — often on a phone,
 * standing in front of the lot. Making it a four-step edit is how a site ends
 * up advertising stone that sold last week.
 */
export function StoneListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { taxonomies } = useSiteConfig();

  const { data, isFetching } = useQuery({
    queryKey: ["admin-stones", search, page],
    queryFn: () => adminApi.stones({ search: search || undefined, page, limit: 30 }),
    placeholderData: keepPreviousData,
  });

  const setAvailability = useMutation({
    mutationFn: ({ id, availability }: { id: string; availability: Availability }) =>
      adminApi.setAvailability(id, availability),
    onSuccess: (stone) => {
      toast.success(`${stone.name} — ${stone.availabilityLabel}`);
      // The storefront's cache is invalidated server-side; this refreshes the
      // panel's own views, including the dashboard's verification count.
      queryClient.invalidateQueries({ queryKey: ["admin-stones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["verification-queue"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update"),
  });

  const stones = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Stones"
        subtitle="Every lot. Changing availability here updates the whole site immediately."
        actions={
          <Link to="/admin/stones/new" className="btn-solid">
            Add a stone
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, MOSSANO code or lot number"
          className="w-full max-w-sm border-0 border-b border-ink/20 bg-transparent py-2 text-[0.9rem] placeholder:text-ink-faint/70 focus:border-ink focus:outline-none"
        />
        <p className="label" aria-live="polite">
          {isFetching && !stones.length ? "Loading…" : `${meta?.total ?? 0} lots`}
        </p>
      </div>

      <DataTable
        head={["", "Code", "Stone", "Lot", "Availability", "Verified", "Size", ""]}
        empty={
          stones.length === 0 && !isFetching ? (
            <TableEmpty message={search ? "Nothing matches that search." : "No stones yet."} />
          ) : undefined
        }
      >
        {stones.map((stone) => (
          <tr key={stone.id} className="border-b border-ivory-dark/60 align-middle">
            <td className="py-2.5 pr-4">
              <div className="slab-frame h-10 w-14">
                {stone.primaryImageUrl ? (
                  <img src={stone.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
            </td>
            <td className="py-2.5 pr-6 text-[0.78rem] tabular-nums text-ink-faint">
              {stone.mossanoCode}
            </td>
            <td className="py-2.5 pr-6">
              <Link to={`/admin/stones/${stone.id}`} className="text-[0.88rem] hover:text-brass">
                {stone.name}
              </Link>
              {!stone.isPublished && (
                <span className="ml-2">
                  <Pill tone="muted">Hidden</Pill>
                </span>
              )}
              {stone.isFeatured && (
                <span className="ml-2">
                  <Pill tone="brass">Featured</Pill>
                </span>
              )}
            </td>
            <td className="py-2.5 pr-6 text-[0.78rem] text-ink-faint">{stone.lotNumber ?? "—"}</td>
            <td className="py-2.5 pr-6">
              <AvailabilitySelect
                value={stone.availability}
                disabled={setAvailability.isPending}
                labels={taxonomies?.availability ?? {}}
                onChange={(availability) => setAvailability.mutate({ id: stone.id, availability })}
              />
            </td>
            <td className="py-2.5 pr-6 text-[0.78rem] text-ink-faint">
              {stone.lastVerifiedAt
                ? new Date(stone.lastVerifiedAt).toLocaleDateString("en-IN")
                : "Never"}
            </td>
            <td className="py-2.5 pr-6 text-[0.78rem] tabular-nums text-ink-faint">
              {stone.slabCount ? `${stone.slabCount} slabs` : "—"}
              {stone.areaSqFt ? ` · ${stone.areaSqFt.toLocaleString("en-IN")} sq ft` : ""}
            </td>
            <td className="py-2.5">
              <a
                href={stone.href}
                target="_blank"
                rel="noopener noreferrer"
                className="label underline-offset-4 hover:text-ink hover:underline"
              >
                View
              </a>
            </td>
          </tr>
        ))}
      </DataTable>

      {(meta?.totalPages ?? 1) > 1 && (
        <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
          <button
            type="button"
            className="btn-outline disabled:opacity-30"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="label tabular-nums">
            Page {page} of {meta?.totalPages}
          </span>
          <button
            type="button"
            className="btn-outline disabled:opacity-30"
            disabled={!meta?.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </>
  );
}
