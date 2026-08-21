import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll position on navigation.
 *
 * ⚠ The effect must keep its block body. Written as
 * `useEffect(() => window.scrollTo(0, 0), [pathname])` the arrow returns
 * scrollTo's value, React treats it as cleanup, and the next navigation dies
 * with "destroy is not a function". That shipped twice; `npm run nav-audit`
 * exists to catch a third.
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
