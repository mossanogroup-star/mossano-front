import { StrictMode, useEffect, useState } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { QueryClientProvider, HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { Toaster } from "sonner";

import "./index.css";
import { createQueryClient } from "./app/queryClient";
import { publicRoutes, asRouteObjects } from "./app/router/publicRoutes";
import { adminRoutes } from "./app/router/adminRoutes";
import { useDocumentMeta } from "./app/router/useDocumentMeta";

declare global {
  interface Window {
    __MOSSANO_STATE__?: DehydratedState;
  }
}

/**
 * The full route tree: the public pages the server rendered, plus the admin
 * panel, which is lazy and which the server never sees.
 *
 * Admin routes come first so /admin/login is matched before the public tree's
 * catch-all "*" can claim it.
 */
function App() {
  useDocumentMeta();
  return useRoutes([...adminRoutes, ...asRouteObjects(publicRoutes)]);
}

/**
 * Renders its children only after the first client render.
 *
 * The server tree is `<App />` alone. Anything the client mounts alongside it —
 * sonner's Toaster renders a real <section> immediately — is markup the server
 * never produced, and React reports that as a hydration mismatch and throws the
 * whole root back to client rendering, discarding the server-rendered HTML the
 * SSR pass exists to deliver.
 *
 * Returning null on the first render makes the client's initial output match
 * the server's exactly; the toaster appears on the effect that follows.
 */
function AfterHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready ? <>{children}</> : null;
}

const queryClient = createQueryClient();
const dehydratedState = window.__MOSSANO_STATE__;
const container = document.getElementById("root")!;

const tree = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
          <AfterHydration>
            <Toaster position="top-right" closeButton richColors />
          </AfterHydration>
        </BrowserRouter>
      </HydrationBoundary>
    </QueryClientProvider>
  </StrictMode>
);

/**
 * Hydrate what the server rendered; mount fresh when it did not.
 *
 * The admin panel is served as a bare SPA shell with no server markup, so
 * calling hydrateRoot there would have React try to reconcile against an empty
 * div and warn on every load. The presence of dehydrated state is the reliable
 * signal for which case this is.
 */
if (dehydratedState) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
