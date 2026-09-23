import path from "path";
import { fileURLToPath } from "url";
import { BRAND_COLOURS } from "./src/data/colours.js";

/**
 * Absolute, not "./src/**" — Tailwind resolves a relative content glob against
 * the process's working directory, and in development the process is
 * mossano-back, which serves the storefront through Vite in middleware mode.
 * From there "./src" is the API's source folder, Tailwind matches nothing, and
 * the page arrives with the base layer but not one utility class: an unstyled
 * site that builds perfectly in CI.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Design tokens. Every value is justified in DESIGN.md — read it before adding
 * anything, especially before adding a colour or a border radius.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [path.join(HERE, "index.html"), path.join(HERE, "src/**/*.{js,jsx,ts,tsx}")],
  theme: {
    extend: {
      screens: {
        // Height-based, not width-based. A 1080p laptop at 125% Windows scaling
        // is ~1536px wide but only ~730px tall; a hero sized for a 1000px-tall
        // window pushes its call to action off the bottom of the screen.
        short: { raw: "(max-height: 820px)" },
      },

      colors: BRAND_COLOURS,

      fontFamily: {
        // Cinzel echoes MOSSANO's own painted wordmark — classical roman
        // capitals. Jost carries specification tables quietly underneath.
        display: ["Cinzel", "Trajan Pro", "Georgia", "serif"],
        sans: ["Jost", "system-ui", "sans-serif"],
      },

      // Slabs are cut rectangles. Nothing here is rounded.
      borderRadius: {
        none: "0",
        DEFAULT: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        full: "9999px", // circles only, for genuinely round things
      },

      letterSpacing: {
        wordmark: "0.22em",
        label: "0.18em",
        wide: "0.12em",
      },

      maxWidth: {
        shell: "86rem",
        prose: "38rem",
      },
    },
  },
  plugins: [],
};
