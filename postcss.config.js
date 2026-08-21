import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Tailwind's config path is given explicitly rather than left to auto-discovery.
 *
 * Auto-discovery resolves against `process.cwd()`, and in development the server
 * that drives Vite runs from `mossano-back` — so Tailwind found no config, fell
 * back to its defaults, and every brand token disappeared. It surfaced as
 * "The `bg-ivory` class does not exist", which reads like a typo rather than a
 * config-resolution problem, and only ever in dev: the production build runs
 * with this folder as the cwd and works fine either way.
 */
export default {
  plugins: {
    tailwindcss: { config: path.join(here, "tailwind.config.js") },
    autoprefixer: {},
  },
};
