import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import { adminApi } from "../api/adminApi";
import { cn } from "@/shared/lib/cn";
import type { StoneCard } from "@/shared/api/types";

/**
 * Adds existing stones to an Edit or a private selection.
 *
 * Admin Scope §6's "no need to upload the same stone again" is the whole point:
 * this searches the catalogue and returns references, never copies. Stones
 * already in the collection are shown as such rather than hidden, so the team
 * can see at a glance that a lot they were about to add is already there.
 */
export function StonePicker({
  selectedIds,
  onAdd,
  className,
}: {
  selectedIds: string[];
  onAdd: (stone: StoneCard) => void;
  className?: string;
}) {
  const [search, setSearch] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["stone-options", search],
    queryFn: async () => (await adminApi.stoneOptions({ search: search || undefined })).data,
    // A search box that fires on every keystroke against a 100-lot catalogue is
    // fine; against a growing one it is not. Two characters is the floor.
    enabled: search.length === 0 || search.length >= 2,
  });

  const options = data ?? [];

  return (
    <div className={cn("border border-ivory-dark p-5", className)}>
      <label className="flex items-center gap-3 border-b border-ink/20 pb-2">
        <Search className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.3} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the catalogue by name, code or lot"
          className="w-full border-0 bg-transparent py-1 text-[0.9rem] placeholder:text-ink-faint/70 focus:outline-none"
        />
      </label>

      <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto">
        {options.map((stone) => {
          const already = selectedIds.includes(stone.id);
          return (
            <li key={stone.id}>
              <button
                type="button"
                disabled={already}
                onClick={() => onAdd(stone)}
                className={cn(
                  "flex w-full items-center gap-3 px-2 py-2 text-left transition-colors",
                  already ? "cursor-default opacity-45" : "hover:bg-ivory-deep",
                )}
              >
                <span className="slab-frame h-9 w-12 shrink-0">
                  {stone.primaryImageUrl && (
                    <img
                      src={stone.primaryImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.85rem]">{stone.name}</span>
                  <span className="block text-[0.7rem] text-ink-faint">
                    {stone.mossanoCode} · {stone.availabilityLabel}
                  </span>
                </span>
                {already ? (
                  <span className="label shrink-0">Added</span>
                ) : (
                  <Plus className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.3} />
                )}
              </button>
            </li>
          );
        })}

        {!options.length && (
          <li className="py-6 text-center text-[0.85rem] text-ink-faint">
            {isFetching
              ? "Searching…"
              : search
                ? "Nothing matches."
                : "No stones in the catalogue."}
          </li>
        )}
      </ul>
    </div>
  );
}
