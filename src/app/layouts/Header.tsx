import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { useFavourites } from "@/shared/hooks/useFavourites";
import { cn } from "@/shared/lib/cn";

const NAV = [
  { to: "/new-edit", label: "New Edit" },
  { to: "/shop", label: "Stone Shop" },
  { to: "/look", label: "Shop by Look" },
  { to: "/application", label: "Shop by Application" },
  { to: "/private-sourcing", label: "Private Sourcing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useFavourites();
  const { pathname } = useLocation();

  // Close the drawer on navigation. Without this a tap on a nav link changes
  // the page behind an overlay that is still covering it.
  useEffect(() => setOpen(false), [pathname]);

  // Lock the page behind the drawer, and restore whatever overflow was there
  // before rather than assuming it was "".
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-ivory-dark/60 bg-ivory/95 backdrop-blur-sm">
      <div className="shell flex h-16 items-center justify-between gap-6 sm:h-20">
        <Link to="/" className="wordmark -my-2 shrink-0 py-2 text-[0.95rem] sm:text-[1.05rem]">
          MOSSANO
        </Link>

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "font-sans text-[0.66rem] uppercase tracking-label transition-colors",
                  isActive ? "text-ink" : "text-ink-faint hover:text-ink",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            to="/favourites"
            className="relative -m-2 inline-flex items-center gap-2 p-2 text-ink-faint transition-colors hover:text-ink"
            aria-label={`Favourites${count ? `, ${count} saved` : ""}`}
          >
            <Heart className="h-4 w-4" strokeWidth={1.25} aria-hidden="true" />
            {count > 0 && (
              <span className="font-sans text-[0.66rem] tabular-nums tracking-wide">{count}</span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="-m-2 p-2 text-ink xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={1.25} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.25} />
            )}
          </button>
        </div>
      </div>

      {/* Rendered rather than mounted conditionally so the links are in the
          server's HTML — a crawler that runs no JavaScript still finds every
          section of the site from any page. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-ivory-dark/60 bg-ivory xl:hidden"
      >
        <nav className="shell flex flex-col py-4" aria-label="Primary, mobile">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "border-b border-ivory-dark/50 py-4 font-sans text-[0.75rem] uppercase tracking-label",
                  isActive ? "text-ink" : "text-ink-soft",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
