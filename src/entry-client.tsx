import { StrictMode, useEffect, useState } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router-dom";
import {
  QueryClientProvider,
  HydrationBoundary,
  type DehydratedState,
} from "@tanstack/react-query";
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
 * The full tree: server-rendered public pages plus the lazy admin panel. Admin
 * comes first so /admin/login beats the public tree's catch-all "*".
 */
function App() {
  useDocumentMeta();
  return useRoutes([...adminRoutes, ...asRouteObjects(publicRoutes)]);
}

/**
 * Renders children only after the first client render.
 *
 * ⚠ The server tree is `<App />` alone. Anything mounted beside it — Toaster
 * renders a real <section> — is markup the server never produced, and React
 * throws away the entire server-rendered root over the mismatch.
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
 * Hydrate what the server rendered; mount fresh when it did not. The admin
 * panel is a bare shell, so hydrateRoot there would reconcile against an empty
 * div and warn on every load. Dehydrated state is the reliable signal.
 */
if (dehydratedState) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
