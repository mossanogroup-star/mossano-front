import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { matchRoutes, useRoutes } from "react-router-dom";
import { QueryClientProvider, dehydrate } from "@tanstack/react-query";

import { createQueryClient } from "./app/queryClient";
import {
  publicRoutes,
  asRouteObjects,
  type PublicRoute,
  type RouteMeta,
  SITE_TITLE,
  SITE_DESCRIPTION,
} from "./app/router/publicRoutes";
import { publicQueries } from "./shared/api/publicQueries";
import { configureApiBase } from "./shared/api/http";

/**
 * The server half of the storefront.
 *
 * ── This file must never import the admin panel ──────────────────────────
 * It imports `publicRoutes` and nothing from modules/admin. That is what keeps
 * admin code out of the SSR bundle — enforced by the module graph rather than
 * by anyone remembering. See docs/ARCHITECTURE.md.
 *
 * Called by mossano-back for every non-/api, non-/admin GET.
 */

function App() {
  return useRoutes(asRouteObjects(publicRoutes));
}

/** Escapes a string for an HTML attribute value. */
function attr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Serialises the dehydrated cache for the client.
 *
 * `</script>` inside any string — a stone description, a customer's note —
 * would close the tag early and inject the rest as markup. Escaping the forward
 * slash prevents that; `<!--` closes the same hole for an HTML comment.
 */
function serialiseState(state: unknown) {
  return JSON.stringify(state)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function buildHead(meta: RouteMeta, url: string, origin: string) {
  const canonical = `${origin}${url.split("?")[0]}`;
  const description = meta.description ?? SITE_DESCRIPTION;
  const image = meta.image ?? null;

  const tags = [
    `<title>${attr(meta.title)}</title>`,
    `<meta name="description" content="${attr(description)}" />`,
    `<link rel="canonical" href="${attr(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_TITLE}" />`,
    `<meta property="og:title" content="${attr(meta.title)}" />`,
    `<meta property="og:description" content="${attr(description)}" />`,
    `<meta property="og:url" content="${attr(canonical)}" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
  ];

  // The image is the reason this whole path exists: a stone link forwarded on
  // WhatsApp previews with the actual slab, not a generic logo.
  if (image) {
    tags.push(`<meta property="og:image" content="${attr(image)}" />`);
    tags.push(`<meta name="twitter:image" content="${attr(image)}" />`);
  }

  // Private selections and favourites are rendered for the person holding the
  // link and must not be indexed.
  if (meta.noindex) tags.push(`<meta name="robots" content="noindex, nofollow" />`);

  return tags.join("\n    ");
}

interface RenderArgs {
  url: string;
  template: string;
  origin: string;
}

export async function render({ url, template, origin }: RenderArgs) {
  // Inside Node, fetch has no origin to resolve a relative URL against.
  configureApiBase(origin);

  // A client per request. A shared one would leak one visitor's private
  // selection into another's cache — see createQueryClient.
  const queryClient = createQueryClient();

  const [pathname, rawSearch = ""] = url.split("?");
  const search = new URLSearchParams(rawSearch);
  const matches = matchRoutes(asRouteObjects(publicRoutes), pathname) ?? [];

  const leaf = [...matches].reverse().find((m) => (m.route as PublicRoute).meta);
  const routeWithData = [...matches].reverse().find((m) => (m.route as PublicRoute).prefetch);

  /**
   * Prefetch, but never let it take the page down.
   *
   * If the API is briefly unreachable the page should still render its shell
   * and let the client retry, rather than returning a 500 to a customer who
   * followed a link from WhatsApp. `prefetchQuery` already swallows errors;
   * the try/catch covers anything thrown building the query itself.
   */
  await Promise.all([
    queryClient.prefetchQuery(publicQueries.config()).catch(() => undefined),
    routeWithData
      ? (routeWithData.route as PublicRoute)
          .prefetch!(queryClient, routeWithData.params as Record<string, string>, search)
          .catch(() => undefined)
      : Promise.resolve(),
  ]);

  /**
   * The correct status code, which is not the same question as "did a route
   * match".
   *
   * `/stone/does-not-exist` matches the stone route perfectly well — the route
   * exists, the lot does not. Returning 200 there is a soft 404: the page says
   * "Stone not found" to a human while telling a crawler it is real content, and
   * a withdrawn lot gets indexed and stays in search results.
   *
   * So the answer comes from the prefetch. If the query the route depends on
   * failed with a 4xx, that is the status of the page. Anything else — an API
   * that was briefly unreachable, a 500 — still renders the shell with a 200,
   * because the client will retry and a transient outage should not
   * de-index the catalogue.
   */
  const status = (() => {
    if (matches.some((m) => (m.route as PublicRoute).path === "*")) return 404;

    for (const query of queryClient.getQueryCache().getAll()) {
      if (query.state.status !== "error") continue;
      const code = (query.state.error as { status?: number } | null)?.status;
      if (code === 404 || code === 410) return code;
    }
    return 200;
  })();

  const meta: RouteMeta = leaf
    ? (leaf.route as PublicRoute).meta!(queryClient, leaf.params as Record<string, string>)
    : { title: SITE_TITLE, description: SITE_DESCRIPTION };

  // A page that does not exist must not advertise itself for indexing, whatever
  // its route's meta says.
  if (status >= 400) meta.noindex = true;

  const appHtml = renderToString(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <StaticRouter location={url} future={{ v7_relativeSplatPath: true }}>
          <App />
        </StaticRouter>
      </QueryClientProvider>
    </StrictMode>,
  );

  const state = dehydrate(queryClient);
  queryClient.clear();

  const html = template
    // Replaces the whole marked region rather than just the <title>, so the
    // defaults in index.html cannot survive alongside the route's own tags —
    // two <title> elements would leave the browser showing the wrong one.
    .replace(
      /<!--ssr-head-start-->[\s\S]*?<!--ssr-head-end-->/,
      buildHead(meta, url, origin),
    )
    .replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>\n    <script>window.__MOSSANO_STATE__=${serialiseState(state)}</script>`,
    );

  return { html, status };
}
