import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Two builds from one source tree:
 *
 *   dist/client   the browser bundle, plus the index.html the server templates
 *   dist/server   entry-server.js, imported by mossano-back to render HTML
 *
 * `mossano-back` drives development through Vite's middleware mode, so the
 * storefront hot-reloads at http://localhost:5000 alongside the API. `npm run
 * dev` here starts a standalone client-only server, which is useful for working
 * on admin screens in isolation but does not exercise the SSR path.
 */
export default defineConfig(({ isSsrBuild, mode }) => {
  // The standalone dev server proxies to mossano-back. Only used by
  // `npm run dev` here — under `mossano-back npm run dev` the API is
  // same-origin and this never applies.
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_DEV_API_TARGET || "http://localhost:5000";

  return {
    plugins: [react()],

    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "./src") },
    },

    build: {
      target: "es2020",
      // manualChunks is client-only: React is external in an SSR build, and
      // Rollup refuses to place an external module into a manual chunk.
      rollupOptions: isSsrBuild
        ? {}
        : {
            output: {
              manualChunks: {
                react: ["react", "react-dom", "react-router-dom"],
                query: ["@tanstack/react-query"],
              },
            },
          },
    },

    server: {
      port: 5173,
      // Only used by the standalone dev server; under mossano-back the API is
      // same-origin and this never applies.
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/uploads": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
