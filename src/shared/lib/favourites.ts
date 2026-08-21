/**
 * Favourites — Website §5 and Admin Scope §7.
 *
 * "No account is required in Phase 1. Favourites should remain saved when the
 * customer leaves and comes back to the website on the same device."
 *
 * So: localStorage, holding stone slugs rather than ids. Slugs are what the
 * URLs already carry, they are stable, and they mean a favourites list stays
 * readable if it is ever exported or migrated to a real account in Phase 2.
 *
 * Three things this has to survive, all of which are ordinary rather than
 * exotic:
 *   - server rendering, where `window` does not exist at all
 *   - a browser that throws on localStorage access (private mode, blocked
 *     site data) rather than returning null
 *   - two tabs open at once, where a favourite added in one should appear in
 *     the other
 */
const KEY = "mossano.favourites";
const MAX = 200;

type Listener = (slugs: string[]) => void;
const listeners = new Set<Listener>();

/**
 * The current list, cached by identity.
 *
 * `useSyncExternalStore` compares snapshots with Object.is and re-renders when
 * they differ. Parsing localStorage on every call returns a new array each
 * time, which never compares equal and spins React into an infinite render
 * loop. So the parse happens once, and this reference only changes when the
 * data actually does.
 */
let snapshot: string[] | null = null;

function parse(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Anything could be under this key — another script, an older format, a
    // hand-edited value. Only a clean array of strings is accepted.
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

/** The memoised read. Only re-parses when the cache has been invalidated. */
function read(): string[] {
  if (snapshot === null) snapshot = parse();
  return snapshot;
}

function write(slugs: string[]) {
  snapshot = slugs;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs.slice(0, MAX)));
  } catch {
    // Storage full or blocked. The favourite still applies for this session
    // because listeners fire below; it just will not survive a reload.
  }
  listeners.forEach((fn) => fn(slugs));
}

export const favouritesStore = {
  get: read,

  has(slug: string) {
    return read().includes(slug);
  },

  add(slug: string) {
    const current = read();
    if (current.includes(slug)) return current;
    // Newest first: a favourites page should open on what was just saved.
    const next = [slug, ...current].slice(0, MAX);
    write(next);
    return next;
  },

  remove(slug: string) {
    const next = read().filter((s) => s !== slug);
    write(next);
    return next;
  },

  toggle(slug: string) {
    return read().includes(slug) ? this.remove(slug) : this.add(slug);
  },

  clear() {
    write([]);
  },

  /**
   * Subscribes to changes, including those made in another tab — the `storage`
   * event fires only in *other* tabs, which is exactly the case localStorage
   * writes here do not otherwise cover.
   */
  subscribe(fn: Listener) {
    listeners.add(fn);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      // Written by another tab, so the cache here is stale.
      snapshot = null;
      fn(read());
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(fn);
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  },
};
