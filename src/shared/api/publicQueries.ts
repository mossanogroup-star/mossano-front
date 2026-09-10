/**
 * Storefront queries as plain objects, not hooks, so the same definition is
 * prefetched during SSR and consumed by `useQuery` in the browser. The server
 * cannot fetch one thing and the client ask for another.
 */
import { queryOptions } from "@tanstack/react-query";
import { api, unwrap } from "./http";
import type {
  ApplicationProject,
  ProjectGroup,
  ApplicationTile,
  Edit,
  EditDetail,
  HomePayload,
  LookTile,
  SelectionPayload,
  SiteConfig,
  StoneCard,
  StoneFacets,
  StonePayload,
} from "./types";
import type { ApiMeta } from "./http";

export interface ShopQuery {
  search?: string;
  material?: string[];
  colour?: string[];
  look?: string[];
  application?: string[];
  availability?: string[];
  finish?: string[];
  origin?: string;
  sort?: string;
  page?: number;
}

export interface ShopResult {
  items: StoneCard[];
  meta: ApiMeta & { facets: StoneFacets };
}

export const publicQueries = {
  /**
   * Brand facts and taxonomies. Effectively static, so it is given a long stale
   * time — a filter chip re-fetching its own label on every navigation would be
   * pure noise.
   */
  config: () =>
    queryOptions({
      queryKey: ["config"] as const,
      queryFn: () => unwrap<SiteConfig>(api.get("/public/config")),
      staleTime: 60 * 60 * 1000,
    }),

  home: () =>
    queryOptions({
      queryKey: ["home"] as const,
      queryFn: () => unwrap<HomePayload>(api.get("/public/home")),
    }),

  shop: (query: ShopQuery) =>
    queryOptions({
      queryKey: ["shop", query] as const,
      queryFn: async (): Promise<ShopResult> => {
        const res = await api.get<StoneCard[]>("/public/stones", {
          ...query,
          limit: 24,
        });
        return { items: res.data, meta: res.meta as ShopResult["meta"] };
      },
    }),

  stone: (slug: string) =>
    queryOptions({
      queryKey: ["stone", slug] as const,
      queryFn: () => unwrap<StonePayload>(api.get(`/public/stones/${slug}`)),
    }),

  edits: () =>
    queryOptions({
      queryKey: ["edits"] as const,
      queryFn: () => unwrap<Edit[]>(api.get("/public/edits")),
    }),

  edit: (slug: string) =>
    queryOptions({
      queryKey: ["edit", slug] as const,
      queryFn: () => unwrap<EditDetail>(api.get(`/public/edits/${slug}`)),
    }),

  looks: () =>
    queryOptions({
      queryKey: ["looks"] as const,
      queryFn: () => unwrap<LookTile[]>(api.get("/public/looks")),
    }),

  look: (slug: string) =>
    queryOptions({
      queryKey: ["look", slug] as const,
      queryFn: async () => {
        const res = await api.get<StoneCard[]>(`/public/looks/${slug}`, {
          limit: 48,
        });
        return {
          items: res.data,
          meta: res.meta as ApiMeta & { label: string },
        };
      },
    }),

  applications: () =>
    queryOptions({
      queryKey: ["applications"] as const,
      queryFn: () => unwrap<ApplicationTile[]>(api.get("/public/applications")),
    }),

  application: (slug: string) =>
    queryOptions({
      queryKey: ["application", slug] as const,
      queryFn: async () => {
        const res = await api.get<{
          projects: ApplicationProject[];
          stones: StoneCard[];
        }>(`/public/applications/${slug}`);
        return { ...res.data, meta: res.meta as ApiMeta & { label: string } };
      },
    }),

  applicationProject: (slug: string) =>
    queryOptions({
      queryKey: ["application-project", slug] as const,
      queryFn: () => unwrap<ApplicationProject>(api.get(`/public/applications/projects/${slug}`)),
    }),

  /** Phase-1 feedback §6 — landmark projects, grouped by sector. */
  projects: () =>
    queryOptions({
      queryKey: ["projects"] as const,
      queryFn: () => unwrap<ProjectGroup[]>(api.get("/public/projects")),
    }),

  /**
   * Website §5. POSTed, not GET: the list can run to dozens of slugs, and a
   * shortlist should not sit in access logs or browser history. Never
   * prefetched — the server has no idea what this device saved.
   */
  favourites: (slugs: string[]) =>
    queryOptions({
      queryKey: ["favourites", slugs] as const,
      queryFn: () => unwrap<StoneCard[]>(api.post("/public/favourites", { slugs })),
      enabled: slugs.length > 0,
    }),

  selection: (token: string) =>
    queryOptions({
      queryKey: ["selection", token] as const,
      queryFn: () => unwrap<SelectionPayload>(api.get(`/public/selections/${token}`)),
      // A private link is personal; never let it linger in a shared cache layer.
      gcTime: 0,
    }),
};
