import type { QueryClient } from "@tanstack/react-query";
import type { RouteObject } from "react-router-dom";

import { PublicLayout } from "../layouts/PublicLayout";
import { HomePage } from "@/modules/landing/pages/HomePage";
import {
  AboutPage,
  ContactPage,
  NotFoundPage,
} from "@/modules/landing/pages/AboutContactPages";
import { ShopPage } from "@/modules/stone/pages/ShopPage";
import { StoneDetailPage } from "@/modules/stone/pages/StoneDetailPage";
import { NewEditPage } from "@/modules/edit/pages/NewEditPage";
import { EditDetailPage } from "@/modules/edit/pages/EditDetailPage";
import { LookIndexPage, LookDetailPage } from "@/modules/look/pages/LookPages";
import {
  ApplicationIndexPage,
  ApplicationDetailPage,
  ApplicationProjectPage,
} from "@/modules/application/pages/ApplicationPages";
import { FavouritesPage } from "@/modules/favourite/pages/FavouritesPage";
import { PrivateSourcingPage } from "@/modules/sourcing/pages/PrivateSourcingPage";
import { SelectionPage } from "@/modules/selection/pages/SelectionPage";

import { publicQueries } from "@/shared/api/publicQueries";

export interface RouteMeta {
  title: string;
  description?: string;
  image?: string | null;
  /** Private pages that must never be indexed — a selection link, in practice. */
  noindex?: boolean;
}

type Params = Record<string, string | undefined>;

/**
 * A public route, plus the two things server rendering needs from it.
 *
 * `prefetch` fills the query cache before renderToString runs, so the HTML the
 * server produces contains real content rather than a loading state — the whole
 * point of rendering on the server for a site discovered through forwarded
 * links.
 *
 * `meta` runs after the prefetch, against the data it fetched, which is what
 * lets a stone page carry its own title, description and og:image instead of
 * the site defaults. That is the difference between a WhatsApp preview showing
 * the slab and showing nothing.
 */
export interface PublicRoute {
  path?: string;
  index?: boolean;
  Component?: RouteObject["Component"];
  children?: PublicRoute[];
  prefetch?: (
    qc: QueryClient,
    params: Params,
    search: URLSearchParams,
  ) => Promise<unknown>;
  meta?: (qc: QueryClient, params: Params) => RouteMeta;
}

/**
 * React Router's own RouteObject is a discriminated union on `index`, which
 * cannot be extended with an optional boolean `index` without the two halves
 * conflicting. The extra fields here are ours and mean nothing to the router,
 * so the table is declared in our shape and narrowed at the three points that
 * hand it to React Router.
 */
export const asRouteObjects = (routes: PublicRoute[]) =>
  routes as unknown as RouteObject[];

const SITE_TITLE = "MOSSANO MARMO";
const SITE_DESCRIPTION =
  "MOSSANO MARMO curates marble, granite and natural stone from quarries worldwide. " +
  "Verified slab availability, actual slab photography and private sourcing for architects and designers.";

const withSuffix = (title: string) => `${title} — ${SITE_TITLE}`;

export const publicRoutes: PublicRoute[] = [
  {
    path: "/",
    Component: PublicLayout,
    children: [
      {
        index: true,
        Component: HomePage,
        prefetch: (qc) => qc.prefetchQuery(publicQueries.home()),
        meta: () => ({
          title: "MOSSANO MARMO — Curated Natural Stone, Sourced Globally",
          description: SITE_DESCRIPTION,
        }),
      },

      {
        path: "shop",
        Component: ShopPage,
        prefetch: (qc, _params, search) => {
          // The query must match what ShopPage builds from the same URL, or
          // the client re-fetches on hydration and the SSR work is wasted.
          const query: Record<string, unknown> = {};
          for (const key of [
            "material",
            "colour",
            "look",
            "application",
            "availability",
            "finish",
          ]) {
            const raw = search.get(key);
            if (raw) query[key] = raw.split(",").filter(Boolean);
          }
          for (const key of ["search", "sort"]) {
            const raw = search.get(key);
            if (raw) query[key] = raw;
          }
          const page = Number(search.get("page") || 1);
          if (page > 1) query.page = page;
          return qc.prefetchQuery(publicQueries.shop(query));
        },
        meta: () => ({
          title: withSuffix("Stone Shop"),
          description:
            "Browse every lot MOSSANO holds — marble, granite and natural stone, with verified availability and actual slab photography.",
        }),
      },

      {
        path: "stone/:slug",
        Component: StoneDetailPage,
        prefetch: (qc, params) =>
          qc.prefetchQuery(publicQueries.stone(params.slug!)),
        meta: (qc, params) => {
          const payload = qc.getQueryData(
            publicQueries.stone(params.slug!).queryKey,
          );
          const stone = payload?.stone;
          if (!stone) return { title: withSuffix("Stone") };

          // The description states availability, because that is the fact the
          // preview is being forwarded to communicate.
          const facts = [stone.origin, stone.availabilityLabel]
            .filter(Boolean)
            .join(" · ");
          return {
            title: `${stone.mossanoCode} ${stone.name} — ${SITE_TITLE}`,
            description:
              stone.description ||
              `${stone.name}. ${facts}. Enquire with MOSSANO MARMO.`,
            image: stone.primaryImageUrl,
          };
        },
      },

      {
        path: "new-edit",
        Component: NewEditPage,
        prefetch: (qc) => qc.prefetchQuery(publicQueries.edits()),
        meta: () => ({
          title: withSuffix("The New Edit"),
          description:
            "MOSSANO's curated collections — what is available now, what arrives next, and an early view of what is coming.",
        }),
      },
      {
        path: "new-edit/:slug",
        Component: EditDetailPage,
        prefetch: (qc, params) =>
          qc.prefetchQuery(publicQueries.edit(params.slug!)),
        meta: (qc, params) => {
          const edit = qc.getQueryData(
            publicQueries.edit(params.slug!).queryKey,
          );
          return edit
            ? {
                title: `${edit.title} — ${SITE_TITLE}`,
                description:
                  edit.subtitle || edit.description || SITE_DESCRIPTION,
                image: edit.coverImage?.url ?? null,
              }
            : { title: withSuffix("Edit") };
        },
      },

      {
        path: "look",
        Component: LookIndexPage,
        prefetch: (qc) => qc.prefetchQuery(publicQueries.looks()),
        meta: () => ({
          title: withSuffix("Shop by Look"),
          description:
            "Quiet Luxury, Dramatic, Warm & Earthy, Dark & Moody, Green Statement, Bookmatch — find the mood first.",
        }),
      },
      {
        path: "look/:slug",
        Component: LookDetailPage,
        prefetch: (qc, params) =>
          qc.prefetchQuery(publicQueries.look(params.slug!)),
        meta: (qc, params) => {
          const data = qc.getQueryData(
            publicQueries.look(params.slug!).queryKey,
          );
          const label = (data?.meta?.label as string) ?? "Look";
          return {
            title: withSuffix(label),
            description: `${label} natural stone, curated by MOSSANO MARMO.`,
            image: data?.items?.[0]?.primaryImageUrl ?? null,
          };
        },
      },

      {
        path: "application",
        Component: ApplicationIndexPage,
        prefetch: (qc) => qc.prefetchQuery(publicQueries.applications()),
        meta: () => ({
          title: withSuffix("Shop by Application"),
          description:
            "Bathroom, kitchen, reception, bar, hotel lobby, penthouse flooring — natural stone chosen for where it is going.",
        }),
      },
      {
        path: "application/:slug",
        Component: ApplicationDetailPage,
        prefetch: (qc, params) =>
          qc.prefetchQuery(publicQueries.application(params.slug!)),
        meta: (qc, params) => {
          const data = qc.getQueryData(
            publicQueries.application(params.slug!).queryKey,
          );
          const label = (data?.meta?.label as string) ?? "Application";
          return {
            title: withSuffix(label),
            description: `Natural stone for ${label.toLowerCase()}, curated by MOSSANO MARMO.`,
          };
        },
      },
      {
        path: "application/:slug/:projectSlug",
        Component: ApplicationProjectPage,
        prefetch: (qc, params) =>
          qc.prefetchQuery(
            publicQueries.applicationProject(params.projectSlug!),
          ),
        meta: (qc, params) => {
          const project = qc.getQueryData(
            publicQueries.applicationProject(params.projectSlug!).queryKey,
          );
          return project
            ? {
                title: `${project.projectName ?? project.title} — ${SITE_TITLE}`,
                description: project.description || SITE_DESCRIPTION,
                image: project.coverImage?.url ?? null,
              }
            : { title: withSuffix("Project") };
        },
      },

      {
        path: "favourites",
        Component: FavouritesPage,
        // Deliberately not prefetched: the list lives on the visitor's device,
        // so there is nothing the server could usefully fetch. See
        // FavouritesPage for why that is correct rather than a shortcoming.
        meta: () => ({
          title: withSuffix("Favourites"),
          description: "The stone you have saved on this device.",
          noindex: true,
        }),
      },

      {
        path: "private-sourcing",
        Component: PrivateSourcingPage,
        meta: () => ({
          title: withSuffix("Private Sourcing"),
          description:
            "Send MOSSANO a requirement — material, colour, quantity, budget and date — and receive curated options with actual slab photography.",
        }),
      },

      {
        path: "selection/:token",
        Component: SelectionPage,
        prefetch: (qc, params) =>
          qc.prefetchQuery(publicQueries.selection(params.token!)),
        // Rendered on the server so the customer sees content immediately, but
        // never indexed: the token is the only thing keeping it private, and a
        // search engine that crawls it publishes a client's shortlist.
        meta: () => ({
          title: withSuffix("Private Selection"),
          description: "A selection prepared by MOSSANO MARMO.",
          noindex: true,
        }),
      },

      {
        path: "about",
        Component: AboutPage,
        meta: () => ({
          title: withSuffix("About"),
          description:
            "Fifteen years sourcing marble, granite and natural stone from Kishangarh, Rajasthan and from the quarries themselves.",
        }),
      },
      {
        path: "contact",
        Component: ContactPage,
        meta: () => ({
          title: withSuffix("Contact"),
          description:
            "WhatsApp, telephone and email for MOSSANO MARMO, Natural Stone House, Kishangarh, Rajasthan.",
        }),
      },

      {
        path: "*",
        Component: NotFoundPage,
        meta: () => ({ title: withSuffix("Page not found"), noindex: true }),
      },
    ],
  },
];

export { SITE_TITLE, SITE_DESCRIPTION };
