import { useEffect } from "react";
import { useLocation, matchRoutes } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { publicRoutes, asRouteObjects, type PublicRoute } from "./publicRoutes";

function setTag(selector: string, attr: "content" | "href", value: string | null) {
  const el = document.head.querySelector(selector);
  if (!el) return;
  if (value === null) el.removeAttribute(attr);
  else el.setAttribute(attr, value);
}

/**
 * Keeps the document title and social tags in step on client-side navigation.
 *
 * The server stamps these into the HTML for the first page — which is the one
 * that matters for a forwarded link, since a crawler never navigates. This hook
 * covers everything after that, so a visitor who browses from the home page to
 * a stone and then bookmarks or shares it gets that stone's title rather than
 * the home page's.
 *
 * It reads the same `meta` functions the server does, from the same route
 * table, so the two cannot describe a page differently.
 */
export function useDocumentMeta() {
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const matches = matchRoutes(asRouteObjects(publicRoutes), location.pathname);
    if (!matches?.length) return;

    // The deepest match that actually declares meta — a layout route does not.
    const leaf = [...matches].reverse().find((m) => (m.route as PublicRoute).meta);
    if (!leaf) return;

    const meta = (leaf.route as PublicRoute).meta!(
      queryClient,
      leaf.params as Record<string, string | undefined>,
    );

    document.title = meta.title;
    setTag('meta[name="description"]', "content", meta.description ?? null);
    setTag('meta[property="og:title"]', "content", meta.title);
    setTag('meta[property="og:description"]', "content", meta.description ?? null);
    setTag('meta[property="og:url"]', "content", window.location.href);
    setTag('link[rel="canonical"]', "href", window.location.origin + location.pathname);
    if (meta.image) setTag('meta[property="og:image"]', "content", meta.image);
  }, [location.pathname, location.search, queryClient]);
}
