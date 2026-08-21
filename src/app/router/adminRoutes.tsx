import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";

/**
 * The admin panel.
 *
 * Every screen is `React.lazy`, so a customer who never types /admin downloads
 * none of it — the panel's forms, tables and editors would otherwise ride along
 * in the bundle of a storefront whose entire premise is photography loading
 * fast on a phone.
 *
 * This file is imported only by entry-client.tsx. entry-server.tsx imports the
 * public route tree alone, which means the SSR bundle cannot contain admin code
 * even by accident — the module graph enforces it rather than a convention.
 */
const AdminLayout = lazy(() =>
  import("@/modules/admin/layouts/AdminLayout").then((m) => ({
    default: m.AdminLayout,
  })),
);
const LoginPage = lazy(() =>
  import("@/modules/admin/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const DashboardPage = lazy(() =>
  import("@/modules/admin/dashboard/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const StoneListPage = lazy(() =>
  import("@/modules/admin/stone/pages/StoneListPage").then((m) => ({
    default: m.StoneListPage,
  })),
);
const StoneEditPage = lazy(() =>
  import("@/modules/admin/stone/pages/StoneEditPage").then((m) => ({
    default: m.StoneEditPage,
  })),
);
const EditListPage = lazy(() =>
  import("@/modules/admin/edit/pages/EditListPage").then((m) => ({
    default: m.EditListPage,
  })),
);
const EditDetailPage = lazy(() =>
  import("@/modules/admin/edit/pages/EditDetailPage").then((m) => ({
    default: m.EditDetailPage,
  })),
);
const EnquiryListPage = lazy(() =>
  import("@/modules/admin/enquiry/pages/EnquiryListPage").then((m) => ({
    default: m.EnquiryListPage,
  })),
);
const EnquiryDetailPage = lazy(() =>
  import("@/modules/admin/enquiry/pages/EnquiryDetailPage").then((m) => ({
    default: m.EnquiryDetailPage,
  })),
);
const SelectionListPage = lazy(() =>
  import("@/modules/admin/selection/pages/SelectionListPage").then((m) => ({
    default: m.SelectionListPage,
  })),
);
const SelectionEditPage = lazy(() =>
  import("@/modules/admin/selection/pages/SelectionEditPage").then((m) => ({
    default: m.SelectionEditPage,
  })),
);
const ApplicationListPage = lazy(() =>
  import("@/modules/admin/application/pages/ApplicationListPage").then((m) => ({
    default: m.ApplicationListPage,
  })),
);
const MediaLibraryPage = lazy(() =>
  import("@/modules/admin/media/pages/MediaLibraryPage").then((m) => ({
    default: m.MediaLibraryPage,
  })),
);
const TeamPage = lazy(() =>
  import("@/modules/admin/team/pages/TeamPage").then((m) => ({
    default: m.TeamPage,
  })),
);

function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <p className="label">Loading…</p>
    </div>
  );
}

const wrap = (element: React.ReactNode) => (
  <Suspense fallback={<Loading />}>{element}</Suspense>
);

export const adminRoutes: RouteObject[] = [
  { path: "/admin/login", element: wrap(<LoginPage />) },
  {
    path: "/admin",
    element: wrap(
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>,
    ),
    children: [
      { index: true, element: wrap(<DashboardPage />) },
      { path: "stones", element: wrap(<StoneListPage />) },
      { path: "stones/new", element: wrap(<StoneEditPage />) },
      { path: "stones/:id", element: wrap(<StoneEditPage />) },
      { path: "edits", element: wrap(<EditListPage />) },
      { path: "edits/:id", element: wrap(<EditDetailPage />) },
      { path: "applications", element: wrap(<ApplicationListPage />) },
      { path: "enquiries", element: wrap(<EnquiryListPage />) },
      { path: "enquiries/:id", element: wrap(<EnquiryDetailPage />) },
      { path: "selections", element: wrap(<SelectionListPage />) },
      { path: "selections/new", element: wrap(<SelectionEditPage />) },
      { path: "selections/:id", element: wrap(<SelectionEditPage />) },
      { path: "media", element: wrap(<MediaLibraryPage />) },
      { path: "team", element: wrap(<TeamPage />) },
    ],
  },
];
