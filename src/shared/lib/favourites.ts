/**
 * Favourites — Website §5: no account in Phase 1, saved on the device.
 *
 * localStorage, holding slugs rather than ids so the list stays readable if it
 * is ever migrated to real accounts. Has to survive three ordinary cases:
 * server rendering (no `window`), a browser that throws on storage access
 * (private mode, blocked site data), and two tabs open at once.
 */
const KEY = "mossano.favourites";
const MAX = 200;

type Listener = (slugs: string[]) => void;
const listeners = new Set<Listener>();

/**
 * Cached by identity. `useSyncExternalStore` compares snapshots with Object.is,
 * so parsing localStorage on every call returns a fresh array that never
 * compares equal — an infinite render loop.
 */
let snapshot: string[] | null = null;

function parse(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Another script, an older format, a hand-edited value — only a clean
    // array of strings is accepted.
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
   * Subscribes to changes. The `storage` event fires only in *other* tabs,
   * which is exactly the case local writes do not cover.
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
