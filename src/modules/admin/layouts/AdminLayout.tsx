import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Gem,
  CalendarRange,
  Images,
  Inbox,
  Share2,
  Users,
  Building2,
  Palette,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession, useLogout } from "../auth/useSession";
import { adminApi } from "../api/adminApi";
import { ScrollToTop } from "@/app/layouts/ScrollToTop";
import { cn } from "@/shared/lib/cn";
import { Wordmark } from "@/shared/components/Wordmark";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/stones", label: "Stones", Icon: Gem },
  { to: "/admin/edits", label: "Edits", Icon: CalendarRange },
  { to: "/admin/applications", label: "Applications", Icon: Images },
  { to: "/admin/looks", label: "Looks", Icon: Palette },
  { to: "/admin/clients", label: "Clients", Icon: Building2 },
  {
    to: "/admin/enquiries",
    label: "Enquiries",
    Icon: Inbox,
    badge: "enquiries",
  },
  { to: "/admin/selections", label: "Selections", Icon: Share2 },
  { to: "/admin/media", label: "Media", Icon: Images },
  { to: "/admin/team", label: "Team", Icon: Users, adminOnly: true },
];

/**
 * The admin shell.
 *
 * Same palette and type as the storefront, because it is the same brand and the
 * team should not feel like they have left the site — but denser, since these
 * screens are tables and forms rather than photography.
 */
export function AdminLayout() {
  const { user } = useSession();
  const logout = useLogout();

  // The one number worth carrying in the navigation: how many enquiries nobody
  // has answered. It is what the panel is opened for.
  const { data: summary } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => adminApi.dashboard(),
    refetchInterval: 2 * 60 * 1000,
  });

  const visible = NAV.filter((item) => !item.adminOnly || user?.role === "admin");

  return (
    <div className="min-h-screen bg-ivory">
      <ScrollToTop />

      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-ivory-dark bg-ivory-deep lg:flex lg:flex-col">
          <div className="border-b border-ivory-dark px-6 py-6">
            <Link to="/admin">
              <Wordmark className="text-[0.9rem]" />
            </Link>
            <p className="label mt-1">Admin</p>
          </div>

          <nav className="flex-1 px-3 py-5" aria-label="Admin">
            {visible.map(({ to, end, label, Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 font-sans text-[0.78rem] transition-colors",
                    isActive
                      ? "bg-ink text-ivory"
                      : "text-ink-soft hover:bg-ivory-dark/40 hover:text-ink",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.3} aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {badge === "enquiries" && (summary?.enquiries.new ?? 0) > 0 && (
                  <span className="bg-brass px-1.5 py-0.5 text-[0.6rem] tabular-nums text-ivory">
                    {summary!.enquiries.new}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-ivory-dark px-6 py-5">
            <p className="text-[0.8rem] text-ink">{user?.name}</p>
            <p className="label mt-0.5">{user?.role}</p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-sans text-[0.66rem] uppercase tracking-label text-ink-faint transition-colors hover:text-ink"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.3} />
                View site
              </a>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 font-sans text-[0.66rem] uppercase tracking-label text-ink-faint transition-colors hover:text-ink"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.3} />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile navigation: a scrolling strip rather than a drawer. The
              team works from a phone in the yard, and a tap-to-open menu is one
              interaction too many for switching between two screens. */}
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-ivory-dark bg-ivory-deep px-3 py-2 lg:hidden">
            {visible.map(({ to, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap px-3 py-2 font-sans text-[0.7rem] uppercase tracking-label",
                    isActive ? "bg-ink text-ivory" : "text-ink-soft",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={logout}
              className="whitespace-nowrap px-3 py-2 font-sans text-[0.7rem] uppercase tracking-label text-ink-faint"
            >
              Sign out
            </button>
          </div>

          <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
