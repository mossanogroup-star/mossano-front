import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll position on navigation.
 *
 * ── Read the body of the effect before changing it ──────────────────────────
 * This must keep its block body. Written as
 *
 *     useEffect(() => window.scrollTo(0, 0), [pathname])
 *
 * the arrow implicitly returns whatever scrollTo returns. React treats an
 * effect's return value as its cleanup function, calls it on the next
 * navigation, and the app dies with "destroy is not a function". That shipped
 * twice in this project. `npm run nav-audit` walks every route and fails on any
 * console error, specifically to catch it a third time.
 *
 * The hash branch matters too: an in-page anchor should land on its target, not
 * be yanked back to the top.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
