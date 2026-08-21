import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { cn } from "@/shared/lib/cn";
import type { FacetBucket, StoneFacets } from "@/shared/api/types";

interface Group {
  key: keyof StoneFacets;
  param: string;
  title: string;
}

/**
 * Website §3's filter rail.
 *
 * Which groups appear is decided by the data, not by this list. Origin, finish
 * and material are recorded in none of the client's catalogues, so until the
 * team enters them those facets come back empty — and a filter that returns
 * nothing reads as a broken site rather than an empty category. Every group
 * below is dropped when its facet has no buckets, and every option within a
 * group is dropped when its count is zero.
 */
const GROUPS: Group[] = [
  { key: "availability", param: "availability", title: "Availability" },
  { key: "looks", param: "look", title: "Look" },
  { key: "colour", param: "colour", title: "Colour" },
  { key: "material", param: "material", title: "Material" },
  { key: "applications", param: "application", title: "Application" },
  { key: "finish", param: "finish", title: "Finish" },
];

interface Props {
  facets?: StoneFacets;
  selected: Record<string, string[]>;
  onToggle: (param: string, value: string) => void;
  onClear: () => void;
  className?: string;
}

export function FilterRail({ facets, selected, onToggle, onClear, className }: Props) {
  const { taxonomies } = useSiteConfig();

  /** Facet values are slugs; the labels come from the shared taxonomy. */
  const labelFor = (param: string, value: string): string => {
    if (!taxonomies) return value;
    const lists: Record<string, Array<{ slug: string; label: string }>> = {
      look: taxonomies.looks,
      application: taxonomies.applications,
      material: taxonomies.materials,
      colour: taxonomies.colours,
      finish: taxonomies.finishes,
    };
    if (param === "availability") {
      return taxonomies.availability[value as keyof typeof taxonomies.availability] ?? value;
    }
    return lists[param]?.find((t) => t.slug === value)?.label ?? value;
  };

  const activeCount = Object.values(selected).reduce((n, list) => n + list.length, 0);

  const visible = GROUPS.map((group) => ({
    ...group,
    buckets: (facets?.[group.key] ?? []).filter((b: FacetBucket) => b.count > 0),
  })).filter((group) => group.buckets.length > 1 || (group.buckets.length === 1 && selected[group.param]?.length));

  return (
    <aside className={cn("space-y-10", className)} aria-label="Filter stone">
      <div className="flex items-baseline justify-between">
        <p className="label">Refine</p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="font-sans text-[0.66rem] uppercase tracking-label text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Clear ({activeCount})
          </button>
        )}
      </div>

      {visible.map((group) => (
        <fieldset key={group.param}>
          <legend className="label mb-3">{group.title}</legend>
          <ul className="space-y-2">
            {group.buckets.map((bucket) => {
              const isOn = selected[group.param]?.includes(bucket.value) ?? false;
              return (
                <li key={bucket.value}>
                  <label className="flex cursor-pointer items-baseline justify-between gap-3 py-0.5 text-[0.85rem]">
                    <span className="inline-flex items-baseline gap-2.5">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => onToggle(group.param, bucket.value)}
                        className="h-3 w-3 shrink-0 translate-y-0.5 appearance-none border border-ink/30 checked:border-ink checked:bg-ink focus-visible:ring-1 focus-visible:ring-brass"
                      />
                      <span className={cn(isOn ? "text-ink" : "text-ink-soft")}>
                        {labelFor(group.param, bucket.value)}
                      </span>
                    </span>
                    <span className="label tabular-nums">{bucket.count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      {!visible.length && (
        <p className="text-[0.85rem] leading-relaxed text-ink-faint">
          Filters appear here as MOSSANO records material, colour and finish
          against each lot.
        </p>
      )}
    </aside>
  );
}
