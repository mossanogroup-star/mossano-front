/**
 * Query definitions for the storefront.
 *
 * Each one is a plain object rather than a hook, so the same definition can be
 * prefetched on the server during SSR and consumed by `useQuery` in the
 * browser. That is what keeps the two paths honest: there is no way for the
 * server to fetch one thing and the client to ask for another, because both
 * reference this object and its key.
 */
import { queryOptions } from "@tanstack/react-query";
import { api, unwrap } from "./http";
import type {
  ApplicationProject,
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
        const res = await api.get<StoneCard[]>(`/public/looks/${slug}`, { limit: 48 });
        return { items: res.data, meta: res.meta as ApiMeta & { label: string } };
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
        const res = await api.get<{ projects: ApplicationProject[]; stones: StoneCard[] }>(
          `/public/applications/${slug}`,
        );
        return { ...res.data, meta: res.meta as ApiMeta & { label: string } };
      },
    }),

  applicationProject: (slug: string) =>
    queryOptions({
      queryKey: ["application-project", slug] as const,
      queryFn: () => unwrap<ApplicationProject>(api.get(`/public/applications/projects/${slug}`)),
    }),

  /**
   * Website §5. POSTed rather than GET because the list lives on the device and
   * can run to dozens of slugs — long enough to break a URL, and private enough
   * that it should not sit in access logs or browser history.
   *
   * Not prefetched on the server: favourites are per-device, and the server has
   * no idea what this visitor saved.
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
