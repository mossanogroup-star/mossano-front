import { useCallback, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { publicQueries, type ShopQuery } from "@/shared/api/publicQueries";
import { Section, EmptyState } from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { FilterRail } from "../components/FilterRail";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";

const MULTI = ["material", "colour", "look", "application", "availability", "finish"] as const;

const SORTS = [
  { value: "default", label: "Available first" },
  { value: "newest", label: "Recently added" },
  { value: "name", label: "Name" },
  { value: "area-desc", label: "Largest lot" },
];

/**
 * Website §3 — the Stone Shop.
 *
 * Filter state lives in the URL rather than in component state, which is what
 * makes a filtered view shareable: the brief's premise is that architects pass
 * links around on WhatsApp, so "dark and moody, available, over 2000 sq ft"
 * has to survive being forwarded. It also means the server can render exactly
 * the same page the sender saw.
 */
export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const [railOpen, setRailOpen] = useState(false);
  const { whatsapp } = useSiteConfig();

  const query = useMemo<ShopQuery>(() => {
    const q: ShopQuery = {};
    for (const key of MULTI) {
      const raw = params.get(key);
      if (raw) q[key] = raw.split(",").filter(Boolean);
    }
    const search = params.get("search");
    if (search) q.search = search;
    const sort = params.get("sort");
    if (sort) q.sort = sort;
    const page = Number(params.get("page") || 1);
    if (page > 1) q.page = page;
    return q;
  }, [params]);

  const selected = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const key of MULTI) out[key] = (params.get(key) ?? "").split(",").filter(Boolean);
    return out;
  }, [params]);

  const { data, isFetching } = useQuery({
    ...publicQueries.shop(query),
    // Keeps the current grid on screen while the next filter combination
    // loads, instead of flashing an empty page between two full ones.
    placeholderData: keepPreviousData,
  });

  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params);
      mutate(next);
      // Any filter change resets paging — page 3 of the old result set is
      // meaningless against the new one.
      next.delete("page");
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const toggle = useCallback(
    (param: string, value: string) =>
      update((next) => {
        const current = (next.get(param) ?? "").split(",").filter(Boolean);
        const after = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        if (after.length) next.set(param, after.join(","));
        else next.delete(param);
      }),
    [update],
  );

  const page = Number(params.get("page") || 1);

  const goToPage = useCallback(
    (next: number) => {
      const updated = new URLSearchParams(params);
      if (next <= 1) updated.delete("page");
      else updated.set("page", String(next));
      setParams(updated);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [params, setParams],
  );

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const hasFilters = Object.values(selected).some((v) => v.length) || Boolean(query.search);

  return (
    <Section className="pt-24 sm:pt-28">
      <header className="max-w-2xl">
        <div className="rule" />
        <p className="label mt-4">Stone Shop</p>
        <h1 className="h-display mt-2">Every Lot MOSSANO Holds</h1>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[15rem_1fr] lg:gap-16">
        {/* Rail: a sidebar on desktop, a drawer below it. Rendered in both
            cases so its links and counts are in the server's HTML. */}
        <div className="hidden lg:block">
          <FilterRail
            facets={data?.meta?.facets}
            selected={selected}
            onToggle={toggle}
            onClear={() => setParams({}, { replace: true })}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory-dark pb-4">
            <p className="label" aria-live="polite">
              {isFetching && !items.length ? "Loading…" : `${total} lot${total === 1 ? "" : "s"}`}
            </p>

            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2">
                <span className="label">Sort</span>
                <select
                  value={params.get("sort") ?? "default"}
                  onChange={(e) => update((next) => next.set("sort", e.target.value))}
                  className="border-0 border-b border-ink/20 bg-transparent py-1 font-sans text-[0.8rem] focus:border-ink focus:outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setRailOpen((v) => !v)}
                className="-my-2 inline-flex items-center gap-2 py-2 font-sans text-[0.66rem] uppercase tracking-label lg:hidden"
                aria-expanded={railOpen}
              >
                {railOpen ? (
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
                Filter
              </button>
            </div>
          </div>

          {railOpen && (
            <div className="border-b border-ivory-dark py-8 lg:hidden">
              <FilterRail
                facets={data?.meta?.facets}
                selected={selected}
                onToggle={toggle}
                onClear={() => setParams({}, { replace: true })}
              />
            </div>
          )}

          <div className="mt-12">
            {items.length ? (
              <StoneGrid stones={items} headingLevel={2} />
            ) : (
              <EmptyState
                title={
                  hasFilters ? "Nothing matches those filters" : "The catalogue is being prepared"
                }
                body={
                  hasFilters
                    ? "MOSSANO's network reaches well beyond what is on the site. Tell us what the project needs."
                    : "Stock is being photographed and verified."
                }
                action={
                  <div className="flex flex-wrap justify-center gap-4">
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={() => setParams({}, { replace: true })}
                        className="btn-outline"
                      >
                        Clear filters
                      </button>
                    )}
                    <WhatsAppButton href={whatsapp.general} label="Ask MOSSANO to source it" />
                  </div>
                }
              />
            )}
          </div>

          {/* Paged, not infinite-scrolled, and labelled as paging — the page
              number is in the URL, so a forwarded link lands where the sender
              was. An "infinite" grid cannot do that. */}
          {(data?.meta?.totalPages ?? 1) > 1 && (
            <nav
              className="mt-16 flex items-center justify-between border-t border-ivory-dark pt-8"
              aria-label="Pagination"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="btn-outline disabled:pointer-events-none disabled:opacity-30"
              >
                Previous
              </button>
              <p className="label tabular-nums">
                Page {page} of {data?.meta?.totalPages}
              </p>
              <button
                type="button"
                disabled={!data?.meta?.hasMore}
                onClick={() => goToPage(page + 1)}
                className="btn-outline disabled:pointer-events-none disabled:opacity-30"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </div>
    </Section>
  );
}
