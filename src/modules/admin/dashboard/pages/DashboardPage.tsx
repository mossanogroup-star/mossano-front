import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { PageHeader, Stat, Pill, DataTable, TableEmpty } from "../../components/AdminUi";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";

/**
 * The admin landing screen.
 *
 * Three questions, in the order the team actually asks them: who is waiting for
 * a reply, which lots are claiming an availability nobody has checked, and what
 * is in the Current Edit. Deliberately not a grid of totals — the stone count
 * is a number nobody acts on.
 */
export function DashboardPage() {
  const queryClient = useQueryClient();
  const { taxonomies } = useSiteConfig();

  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => adminApi.dashboard() });
  const { data: queue } = useQuery({
    queryKey: ["verification-queue"],
    queryFn: () => adminApi.verificationQueue(),
  });

  const verify = useMutation({
    mutationFn: (id: string) => adminApi.verifyStone(id),
    onSuccess: (stone) => {
      toast.success(`${stone.name} verified`);
      // The queue, the dashboard counts and every stone list all change.
      queryClient.invalidateQueries();
    },
  });

  const availabilityLabel = (slug: string) =>
    taxonomies?.availability[slug as keyof typeof taxonomies.availability] ?? slug;

  return (
    <>
      <PageHeader
        title="Today"
        subtitle="What needs attention, and what the site is currently showing."
      />

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="New enquiries"
          value={data?.enquiries.new ?? 0}
          tone="attention"
          hint="Nobody has replied yet"
        />
        <Stat
          label="Needs verification"
          value={data?.stones.needsVerification ?? 0}
          tone="attention"
          hint={`Not checked in ${data?.stones.verificationStaleDays ?? 14} days`}
        />
        <Stat label="Stones in catalogue" value={data?.stones.total ?? 0} />
        <Stat label="Live selections" value={data?.selections.active ?? 0} hint="Shared links" />
      </div>

      {/* ── The Current Edit ───────────────────────────────────────────── */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-4 border-b border-ivory-dark pb-3">
          <h2 className="font-display text-[1rem] uppercase tracking-wide">Current Edit</h2>
          <Link to="/admin/edits" className="label underline-offset-4 hover:underline">
            Manage Edits
          </Link>
        </div>

        {data?.currentEdit ? (
          <div className="flex flex-wrap items-center gap-4 py-5">
            <Link
              to={`/admin/edits/${data.currentEdit.id}`}
              className="font-display text-[1.05rem] uppercase tracking-wide hover:text-brass"
            >
              {data.currentEdit.title}
            </Link>
            <Pill>{data.currentEdit.stoneCount} stones</Pill>
            {/* An unpublished Current Edit is invisible to customers, which is
                easy to miss and expensive to leave — so it is stated here. */}
            {data.currentEdit.isPublished ? (
              <Pill tone="brass">Live</Pill>
            ) : (
              <Pill tone="muted">Draft — not visible on the site</Pill>
            )}
          </div>
        ) : (
          <p className="py-8 text-[0.9rem] text-ink-faint">
            No Edit is set as Current.{" "}
            <Link to="/admin/edits" className="underline underline-offset-4">
              Create one
            </Link>
            .
          </p>
        )}
      </section>

      {/* ── Verification queue ─────────────────────────────────────────── */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-4 border-b border-ivory-dark pb-3">
          <h2 className="font-display text-[1rem] uppercase tracking-wide">
            Availability to confirm
          </h2>
          <Link to="/admin/stones" className="label underline-offset-4 hover:underline">
            All stones
          </Link>
        </div>

        <p className="mt-3 max-w-prose text-[0.82rem] leading-relaxed text-ink-faint">
          The site tells customers when a lot was last verified. Confirming here
          updates that date without changing the status.
        </p>

        <div className="mt-5">
          <DataTable
            head={["Code", "Stone", "Status", "Last verified", ""]}
            empty={queue?.length === 0 ? <TableEmpty message="Everything is up to date." /> : undefined}
          >
            {(queue ?? []).slice(0, 10).map((stone) => (
              <tr key={stone.id} className="border-b border-ivory-dark/60">
                <td className="py-3 pr-6 text-[0.8rem] tabular-nums text-ink-faint">
                  {stone.mossanoCode}
                </td>
                <td className="py-3 pr-6">
                  <Link to={`/admin/stones/${stone.id}`} className="text-[0.88rem] hover:text-brass">
                    {stone.name}
                  </Link>
                </td>
                <td className="py-3 pr-6 text-[0.8rem] text-ink-soft">
                  {availabilityLabel(stone.availability)}
                </td>
                <td className="py-3 pr-6 text-[0.8rem] text-ink-faint">
                  {stone.lastVerifiedAt
                    ? new Date(stone.lastVerifiedAt).toLocaleDateString("en-IN")
                    : "Never"}
                </td>
                <td className="py-3">
                  <button
                    type="button"
                    onClick={() => verify.mutate(stone.id)}
                    disabled={verify.isPending}
                    className="label underline-offset-4 hover:text-ink hover:underline disabled:opacity-40"
                  >
                    Confirm
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      {/* ── Recent enquiries ───────────────────────────────────────────── */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-4 border-b border-ivory-dark pb-3">
          <h2 className="font-display text-[1rem] uppercase tracking-wide">Latest enquiries</h2>
          <Link to="/admin/enquiries" className="label underline-offset-4 hover:underline">
            All enquiries
          </Link>
        </div>

        <div className="mt-5">
          <DataTable
            head={["Ref", "From", "About", "Type", "Status", "When"]}
            empty={
              data?.enquiries.recent.length === 0 ? (
                <TableEmpty message="No enquiries yet." />
              ) : undefined
            }
          >
            {(data?.enquiries.recent ?? []).map((enquiry) => (
              <tr key={enquiry.id} className="border-b border-ivory-dark/60">
                <td className="py-3 pr-6 text-[0.78rem] tabular-nums text-ink-faint">
                  {enquiry.reference}
                </td>
                <td className="py-3 pr-6">
                  <Link
                    to={`/admin/enquiries/${enquiry.id}`}
                    className="text-[0.88rem] hover:text-brass"
                  >
                    {enquiry.name}
                  </Link>
                  {enquiry.company && (
                    <span className="block text-[0.75rem] text-ink-faint">{enquiry.company}</span>
                  )}
                </td>
                <td className="py-3 pr-6 text-[0.8rem] text-ink-soft">
                  {enquiry.stone?.mossanoCode ?? enquiry.stoneSnapshot?.mossanoCode ?? "—"}
                </td>
                <td className="py-3 pr-6">
                  <Pill tone={enquiry.isHighIntent ? "brass" : "muted"}>{enquiry.typeLabel}</Pill>
                </td>
                <td className="py-3 pr-6 text-[0.8rem]">{enquiry.statusLabel}</td>
                <td className="py-3 text-[0.78rem] text-ink-faint">
                  {new Date(enquiry.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>
    </>
  );
}
