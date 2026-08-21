/**
 * The stone catalogue.
 *
 * Every field here was read off the client's own catalogue pages — the captions
 * are burnt into the photographs, so this file is the transcription. Nothing is
 * invented. See CLIENT-FACTS.md for how the spec format was decoded:
 *
 *     "Size- 73*59*94NOS" + "QTY- 2800 SQ FT"
 *       = 73in x 59in slabs, 94 of them, 2,800 sq ft in total
 *
 * Fields the catalogues do not contain are `null`, and the UI renders those as
 * "On request" rather than guessing. That matters more than usual here: an
 * architect specifying a 2,800 sq ft order will discover an invented origin or
 * finish, and MOSSANO's whole proposition is verified availability.
 *
 * ⚠️ Still to come from the client (see CLIENT-FACTS.md § Gaps):
 *   - origin      — required by the brief on every card and stone page
 *   - mossanoCode — the MM-024 scheme in the brief does not exist yet
 *   - finish, thickness
 *   - names for the lots that carry only a number
 *
 * Adding more: the remaining ~75 slabs are cropped in public/slabs/ and
 * inventoried in contact-sheets/. Transcribe from the sheets and append here.
 */

/** Look categories, per the brief's SHOP BY LOOK section. */
export const LOOKS = [
  { slug: "quiet-luxury", label: "Quiet Luxury" },
  { slug: "dramatic", label: "Dramatic" },
  { slug: "warm-earthy", label: "Warm & Earthy" },
  { slug: "dark-moody", label: "Dark & Moody" },
  { slug: "green", label: "Green" },
  { slug: "statement", label: "Statement" },
];

/** Applications, per the brief's SHOP BY APPLICATION section. */
export const APPLICATIONS = [
  { slug: "feature-walls", label: "Feature Walls" },
  { slug: "bathrooms", label: "Bathrooms" },
  { slug: "kitchens", label: "Kitchens" },
  { slug: "bars", label: "Bars" },
  { slug: "fireplaces", label: "Fireplaces" },
  { slug: "dining-tables", label: "Dining Tables" },
  { slug: "furniture", label: "Furniture" },
  { slug: "hospitality", label: "Hospitality" },
  { slug: "retail", label: "Retail" },
];

export const COLLECTIONS = [
  { slug: "beige", label: "Beige" },
  { slug: "grey", label: "Grey & White" },
  { slug: "black", label: "Black" },
];

/**
 * @typedef {object} Stone
 * @property {string}  id          url slug
 * @property {?string} name        null where the catalogue gives only a lot no.
 * @property {string}  lot         the client's own lot number
 * @property {?string} mossanoCode not yet assigned by the client
 * @property {string}  collection
 * @property {string}  look
 * @property {?number} slabL       slab length, inches
 * @property {?number} slabW       slab width, inches
 * @property {?number} slabs       number of slabs in the lot
 * @property {?number} sqft        total area
 * @property {?string} origin      not in the catalogues — must come from client
 * @property {?string} finish      "
 * @property {?string} thickness   "
 * @property {string}  image       path under /slabs
 */

/** @type {Stone[]} */
export const STONES = [
  // ── Beige ──────────────────────────────────────────────────────────────
  {
    id: "classic-beige-16858",
    name: "Classic Beige",
    lot: "16858",
    collection: "beige",
    look: "warm-earthy",
    slabL: 73,
    slabW: 59,
    slabs: 94,
    sqft: 2800,
    image: "beige/beige-p002-1.webp",
  },
  {
    id: "lot-18570",
    name: null,
    lot: "18570",
    collection: "beige",
    look: "quiet-luxury",
    slabL: 85,
    slabW: 66,
    slabs: 84,
    sqft: 1320,
    image: "beige/beige-p003-1.webp",
  },
  {
    id: "lot-17677",
    name: null,
    lot: "17677",
    collection: "beige",
    look: "quiet-luxury",
    slabL: 107,
    slabW: 77,
    slabs: 54,
    sqft: 3080,
    image: "beige/beige-p004-1.webp",
  },
  {
    id: "agora-beige-16971",
    name: "Agora Beige",
    lot: "16971",
    collection: "beige",
    look: "warm-earthy",
    slabL: 72,
    slabW: 57,
    slabs: 35,
    sqft: 1500,
    image: "beige/beige-p005-1.webp",
  },
  {
    id: "creana-diva-18314",
    name: "Creana Diva",
    lot: "18314",
    collection: "beige",
    look: "quiet-luxury",
    slabL: 114,
    slabW: 81,
    slabs: 54,
    sqft: 3460,
    image: "beige/beige-p006-1.webp",
  },
  {
    id: "lot-18286",
    name: null,
    lot: "18286",
    collection: "beige",
    look: "quiet-luxury",
    slabL: 65,
    slabW: 67,
    slabs: 47,
    sqft: 1420,
    image: "beige/beige-p007-1.webp",
  },
  {
    id: "classic-beige-17391",
    name: "Classic Beige",
    lot: "17391",
    collection: "beige",
    look: "warm-earthy",
    slabL: 116,
    slabW: 68,
    slabs: 43,
    sqft: 2350,
    image: "beige/beige-p008-1.webp",
  },
  {
    id: "lot-16775",
    name: null,
    lot: "16775",
    collection: "beige",
    look: "warm-earthy",
    slabL: 96,
    slabW: 71,
    slabs: 57,
    sqft: 2700,
    image: "beige/beige-p009-1.webp",
  },
  {
    id: "agora-beige-16972",
    name: "Agora Beige",
    lot: "16972",
    collection: "beige",
    look: "quiet-luxury",
    slabL: 74,
    slabW: 47,
    slabs: 53,
    sqft: 1300,
    image: "beige/beige-p010-1.webp",
  },
  {
    id: "verde-breccia-15231",
    name: "Verde Breccia",
    lot: "15231",
    collection: "beige",
    look: "green",
    slabL: 118,
    slabW: 78,
    slabs: 19,
    sqft: 1200,
    image: "beige/beige-p011-1.webp",
  },
  {
    id: "lot-17151",
    name: null,
    lot: "17151",
    collection: "beige",
    look: "warm-earthy",
    slabL: 77,
    slabW: 54,
    slabs: null,
    sqft: null,
    image: "beige/beige-p012-1.webp",
  },

  // ── Black ──────────────────────────────────────────────────────────────
  {
    id: "black-forest-11931",
    name: "Black Forest",
    lot: "11931",
    collection: "black",
    look: "dramatic",
    slabL: 93,
    slabW: 72,
    slabs: 55,
    sqft: 2540,
    image: "black/black-p002-1.webp",
  },
  {
    id: "nero-black",
    name: "Nero Black",
    lot: null,
    collection: "black",
    look: "dramatic",
    slabL: 124,
    slabW: 67,
    slabs: 62,
    sqft: 3570,
    image: "black/black-p003-1.webp",
  },
  {
    id: "golden-portoro-350",
    name: "Golden Portoro",
    lot: null,
    collection: "black",
    look: "statement",
    slabL: 109,
    slabW: 78,
    slabs: 6,
    sqft: 350,
    image: "black/black-p004-1.webp",
  },
  {
    id: "belgium-black-14664",
    name: "Belgium Black",
    lot: "14664",
    collection: "black",
    look: "dark-moody",
    slabL: 111,
    slabW: 77,
    slabs: 49,
    sqft: 2900,
    image: "black/black-p005-1.webp",
  },
  {
    id: "black-wave",
    name: "Black Wave",
    lot: null,
    collection: "black",
    look: "dramatic",
    slabL: 106,
    slabW: 75,
    slabs: 6,
    sqft: 330,
    image: "black/black-p006-1.webp",
  },
  {
    id: "black-marquina-17467",
    name: "Black Marquina",
    lot: "17467",
    collection: "black",
    look: "dark-moody",
    slabL: 119,
    slabW: 73,
    slabs: null,
    sqft: null,
    image: "black/black-p007-1.webp",
  },
  {
    id: "golden-portoro-658",
    name: "Golden Portoro",
    lot: "658",
    collection: "black",
    look: "statement",
    slabL: 110,
    slabW: 79,
    slabs: 28,
    sqft: 1730,
    image: "black/black-p012-1.webp",
  },
  {
    id: "lot-14665",
    name: null,
    lot: "14665",
    collection: "black",
    look: "dark-moody",
    slabL: 103,
    slabW: 80,
    slabs: 52,
    sqft: 2970,
    image: "black/black-p015-1.webp",
  },
  {
    id: "lot-9227",
    name: null,
    lot: "9227",
    collection: "black",
    look: "dark-moody",
    slabL: 106,
    slabW: 69,
    slabs: 36,
    sqft: 1830,
    image: "black/black-p025-1.webp",
  },

  // ── Grey & White ───────────────────────────────────────────────────────
  {
    id: "super-white-17733",
    name: "Super White",
    lot: "17733",
    collection: "grey",
    look: "quiet-luxury",
    slabL: 102,
    slabW: 66,
    slabs: 31,
    sqft: 1440,
    image: "grey/grey-p003-1.webp",
  },
  {
    id: "lot-17052-b",
    name: null,
    lot: "17052-B",
    collection: "grey",
    look: "quiet-luxury",
    slabL: 116,
    slabW: 79,
    slabs: 3,
    sqft: 2240,
    image: "grey/grey-p004-1.webp",
  },
].map((s) => ({
  origin: null,
  finish: null,
  thickness: null,
  mossanoCode: null,
  status: s.slabs === null ? "enquire" : "available",
  ...s,
}));

/** Display name — falls back to the lot number where the client has not named it. */
export const stoneTitle = (s) => s.name ?? `Lot ${s.lot}`;

/** "73 × 59 in" — the slab format architects actually read. */
export const slabSize = (s) =>
  s.slabL && s.slabW ? `${s.slabL} × ${s.slabW} in` : null;

/** Availability line for cards, per the brief's "4 slabs available". */
export const availability = (s) => {
  if (s.slabs === null) return "Availability on request";
  if (s.slabs === 1) return "1 slab available";
  return `${s.slabs} slabs available`;
};

export const findStone = (id) => STONES.find((s) => s.id === id);
export const byLook = (look) => STONES.filter((s) => s.look === look);
export const byCollection = (c) => STONES.filter((s) => s.collection === c);

/**
 * THE NEW EDIT — the brief wants 6–12 newly curated stones, refreshed monthly.
 * Until the client has a real curation workflow this is the most striking dozen;
 * it is a hand-picked list rather than "the last twelve added" so the selection
 * reads as curated, which is the whole premise of the feature.
 */
export const EDIT_MONTH = "August 2026";
export const NEW_EDIT_IDS = [
  "golden-portoro-658",
  "creana-diva-18314",
  "nero-black",
  "verde-breccia-15231",
  "black-forest-11931",
  "super-white-17733",
  "classic-beige-16858",
  "belgium-black-14664",
  "lot-17677",
  "black-wave",
  "agora-beige-16971",
  "lot-14665",
];
export const newEdit = () => NEW_EDIT_IDS.map(findStone).filter(Boolean);
