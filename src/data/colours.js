/**
 * The palette, in one place.
 *
 * Imported by both tailwind.config.js and any script that generates brand
 * assets, so the site and its favicon/OG image cannot drift apart — a mistake
 * worth designing out, because when it happens nothing errors and nobody
 * notices until a stale colour is already live.
 *
 * Values follow the brief's stated direction — "warm beige / cream / ivory /
 * dark brown / black typography" — sampled against the client's own catalogue
 * backdrops so the interface sits with the photography rather than against it.
 */
export const BRAND_COLOURS = {
  ivory: {
    DEFAULT: '#f6f3ee', // dominant surface, never pure white
    deep: '#ede7de',
    dark: '#d8cfc2',
  },
  umber: {
    DEFAULT: '#3b2e24', // dark sections, footer — the catalogues' own brown
    deep: '#291f18',
  },
  ink: {
    DEFAULT: '#1a1512', // type, not pure black
    soft: '#5b5048',
    faint: '#8c8177',
  },
  brass: {
    DEFAULT: '#a98a55',
    light: '#c8ac7a',
  },
  // Semantic, deliberately outside the brand palette.
  whatsapp: '#1fb658',
}
