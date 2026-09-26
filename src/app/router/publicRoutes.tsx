import type { QueryClient } from "@tanstack/react-query";
import type { RouteObject } from "react-router-dom";

import { PublicLayout } from "../layouts/PublicLayout";
import { HomePage } from "@/modules/landing/pages/HomePage";
import { AboutPage, ContactPage, NotFoundPage } from "@/modules/landing/pages/AboutContactPages";
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
import { ProjectsPage, ProjectVideosPage } from "@/modules/application/pages/ProjectsPage";
import { ClientsPage } from "@/modules/landing/pages/ClientsPage";
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
 * A public route, plus what server rendering needs from it.
 *
 * `prefetch` fills the query cache before renderToString, so the HTML carries
 * real content. `meta` then runs against that data, which is how a stone page
 * gets its own og:image instead of the site default — the difference between a
 * WhatsApp preview showing the slab and showing nothing.
 */
export interface PublicRoute {
  path?: string;
  index?: boolean;
  Component?: RouteObject["Component"];
  children?: PublicRoute[];
  prefetch?: (qc: QueryClient, params: Params, search: URLSearchParams) => Promise<unknown>;
  meta?: (qc: QueryClient, params: Params) => RouteMeta;
}

/**
 * RouteObject is a discriminated union on `index`, so it cannot carry an
 * optional boolean `index`. The table is declared in our shape and narrowed
 * where it is handed to React Router.
 */
export const asRouteObjects = (routes: PublicRoute[]) => routes as unknown as RouteObject[];

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
        // Both, or the logo strip pops in after hydration on a page whose
        // first screen is meant to be complete.
        prefetch: (qc) =>
          Promise.all([
            qc.prefetchQuery(publicQueries.home()),
            qc.prefetchQuery(publicQueries.clients()),
          ]),
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
        prefetch: (qc, params) => qc.prefetchQuery(publicQueries.stone(params.slug!)),
        meta: (qc, params) => {
          const payload = qc.getQueryData(publicQueries.stone(params.slug!).queryKey);
          const stone = payload?.stone;
          if (!stone) return { title: withSuffix("Stone") };

          // The description states availability, because that is the fact the
          // preview is being forwarded to communicate.
          const facts = [stone.origin, stone.availabilityLabel].filter(Boolean).join(" · ");
          return {
            title: `${stone.mossanoCode} ${stone.name} — ${SITE_TITLE}`,
            description:
              stone.description || `${stone.name}. ${facts}. Enquire with MOSSANO MARMO.`,
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
        prefetch: (qc, params) => qc.prefetchQuery(publicQueries.edit(params.slug!)),
        meta: (qc, params) => {
          const edit = qc.getQueryData(publicQueries.edit(params.slug!).queryKey);
          return edit
            ? {
                title: `${edit.title} — ${SITE_TITLE}`,
                description: edit.subtitle || edit.description || SITE_DESCRIPTION,
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
        prefetch: (qc, params) => qc.prefetchQuery(publicQueries.look(params.slug!)),
        meta: (qc, params) => {
          const data = qc.getQueryData(publicQueries.look(params.slug!).queryKey);
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
        prefetch: (qc, params) => qc.prefetchQuery(publicQueries.application(params.slug!)),
        meta: (qc, params) => {
          const data = qc.getQueryData(publicQueries.application(params.slug!).queryKey);
          const label = (data?.meta?.label as string) ?? "Application";
          return {
            title: withSuffix(label),
            description: `Natural stone for ${label.toLowerCase()}, curated by MOSSANO MARMO.`,
          };
        },
      },
      {
        path: "projects/:projectSlug",
        Component: ApplicationProjectPage,
        prefetch: (qc, params) =>
          qc.prefetchQuery(publicQueries.applicationProject(params.projectSlug!)),
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

      /**
       * Phase-3 feedback keeps Projects and Shop by Application as two tabs, so
       * a project lives at /projects/:slug. This is the address they were
       * published under before, kept working because those links have been
       * forwarded on WhatsApp.
       */
      {
        path: "application/:slug/:projectSlug",
        Component: ApplicationProjectPage,
        prefetch: (qc, params) =>
          qc.prefetchQuery(publicQueries.applicationProject(params.projectSlug!)),
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
        path: "clients",
        Component: ClientsPage,
        prefetch: (qc) => qc.prefetchQuery(publicQueries.clients()),
        meta: () => ({
          title: withSuffix("Our Clients"),
          description:
            "Architects, developers, hotels, banks and brands who build with MOSSANO stone — trusted by visionaries, chosen by industry leaders.",
        }),
      },

      {
        path: "projects",
        Component: ProjectsPage,
        prefetch: (qc) => qc.prefetchQuery(publicQueries.projects()),
        meta: () => ({
          title: withSuffix("Landmark Projects"),
          description:
            "Residences, hotels, corporate headquarters and infrastructure finished in MOSSANO stone — from intimate residences to landmark developments.",
        }),
      },

      // Phase-3 feedback — the Videos tab. A static segment, so it outranks
      // projects/:projectSlug.
      {
        path: "projects/videos",
        Component: ProjectVideosPage,
        prefetch: (qc) => qc.prefetchQuery(publicQueries.projectVideos()),
        meta: () => ({
          title: withSuffix("Project Videos"),
          description:
            "Walkthroughs of residences, hotels and landmark developments finished in MOSSANO stone.",
        }),
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
          title: withSuffix("Personalize Sourcing Desk"),
          description:
            "Send MOSSANO a requirement — material, colour, quantity, budget and date — and receive curated options with actual slab photography.",
        }),
      },

      {
        path: "selection/:token",
        Component: SelectionPage,
        prefetch: (qc, params) => qc.prefetchQuery(publicQueries.selection(params.token!)),
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
            "Over twelve years sourcing marble, granite and natural stone from Mumbai, Dubai and the quarries themselves.",
        }),
      },
      {
        path: "contact",
        Component: ContactPage,
        meta: () => ({
          title: withSuffix("Contact"),
          description:
            "WhatsApp, telephone and email for MOSSANO MARMO — head office and studio in Mumbai, and Dubai.",
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
