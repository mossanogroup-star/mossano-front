import { useCallback, useSyncExternalStore } from "react";
import { favouritesStore } from "../lib/favourites";

/**
 * The favourites list, subscribed to.
 *
 * `useSyncExternalStore` rather than useState + useEffect for one reason that
 * matters here: the storefront is server-rendered, and this hook has to return
 * something during SSR without touching `window`. The third argument is the
 * server snapshot, and returning a stable empty array from it means the server
 * renders "not favourited" for everyone — which is correct, because the server
 * genuinely does not know, and the real state arrives on hydration without a
 * mismatch warning.
 */
const EMPTY: string[] = [];

export function useFavourites() {
  const slugs = useSyncExternalStore(favouritesStore.subscribe, favouritesStore.get, () => EMPTY);

  const toggle = useCallback((slug: string) => favouritesStore.toggle(slug), []);
  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  return {
    slugs,
    count: slugs.length,
    toggle,
    has,
    clear: favouritesStore.clear,
  };
}
