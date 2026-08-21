import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { PageHeader, DataTable, TableEmpty, Pill } from "../../components/AdminUi";
import { cn } from "@/shared/lib/cn";
import type { EnquiryStatus } from "@/shared/api/types";

/** Admin Scope §5: "New → Contacted → Interested → Reserved → Purchased". */
const PIPELINE: Array<{ value: EnquiryStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "reserved", label: "Reserved" },
  { value: "purchased", label: "Purchased" },
  { value: "closed", label: "Closed" },
];

/**
 * One inbox for every form on the site — contact, stone enquiry, reserve, slab
 * video, sourcing brief, pre-book and register-interest. They are filtered
 * rather than separated, because four screens is four places to forget to look.
 */
export function EnquiryListPage() {
  const [status, setStatus] = useState<EnquiryStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["admin-enquiries", status, search, page],
    queryFn: () =>
      adminApi.enquiries({
        status: status || undefined,
        search: search || undefined,
        page,
        limit: 30,
      }),
    placeholderData: keepPreviousData,
  });

  const setEnquiryStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: EnquiryStatus }) =>
      adminApi.setEnquiryStatus(id, next),
    onSuccess: (enquiry) => {
      toast.success(`${enquiry.reference} — ${enquiry.statusLabel}`);
      queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update"),
  });

  const enquiries = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <PageHeader title="Enquiries" subtitle="Everything customers have sent, in one place." />

      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-3">
        <button
          type="button"
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
          className={cn(
            "px-3 py-1.5 font-sans text-[0.7rem] uppercase tracking-label transition-colors",
            status === "" ? "bg-ink text-ivory" : "text-ink-soft hover:text-ink",
          )}
        >
          All
        </button>
        {PIPELINE.map((stage) => (
          <button
            key={stage.value}
            type="button"
            onClick={() => {
              setStatus(stage.value);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 font-sans text-[0.7rem] uppercase tracking-label transition-colors",
              status === stage.value ? "bg-ink text-ivory" : "text-ink-soft hover:text-ink",
            )}
          >
            {stage.label}
          </button>
        ))}

        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, company, reference"
          className="ml-auto w-full max-w-xs border-0 border-b border-ink/20 bg-transparent py-1.5 text-[0.85rem] placeholder:text-ink-faint/70 focus:border-ink focus:outline-none"
        />
      </div>

      <DataTable
        head={["Ref", "From", "Type", "About", "Status", "Received"]}
        empty={
          enquiries.length === 0 && !isFetching ? (
            <TableEmpty message="Nothing here." />
          ) : undefined
        }
      >
        {enquiries.map((enquiry) => (
          <tr
            key={enquiry.id}
            className={cn(
              "border-b border-ivory-dark/60",
              // An unanswered enquiry should be visible from across the room.
              enquiry.status === "new" && "bg-brass/[0.06]",
            )}
          >
            <td className="py-3 pr-6 text-[0.76rem] tabular-nums text-ink-faint">
              {enquiry.reference}
            </td>
            <td className="py-3 pr-6">
              <Link to={`/admin/enquiries/${enquiry.id}`} className="text-[0.88rem] hover:text-brass">
                {enquiry.name}
              </Link>
              <span className="block text-[0.73rem] text-ink-faint">
                {[enquiry.company, enquiry.phone ?? enquiry.email].filter(Boolean).join(" · ")}
              </span>
            </td>
            <td className="py-3 pr-6">
              <Pill tone={enquiry.isHighIntent ? "brass" : "muted"}>{enquiry.typeLabel}</Pill>
            </td>
            <td className="py-3 pr-6 text-[0.8rem] text-ink-soft">
              {enquiry.stone?.mossanoCode ?? enquiry.stoneSnapshot?.mossanoCode ?? "—"}
            </td>
            <td className="py-3 pr-6">
              <select
                value={enquiry.status}
                onChange={(e) =>
                  setEnquiryStatus.mutate({
                    id: enquiry.id,
                    next: e.target.value as EnquiryStatus,
                  })
                }
                disabled={setEnquiryStatus.isPending}
                className="border-0 border-b border-transparent bg-transparent py-0.5 pr-5 text-[0.8rem] hover:border-ink/30 focus:border-ink focus:outline-none"
                aria-label={`Status of ${enquiry.reference}`}
              >
                {PIPELINE.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </td>
            <td className="py-3 text-[0.76rem] text-ink-faint">
              {new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
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
