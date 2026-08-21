/**
 * Every business fact about MOSSANO MARMO, in one place.
 *
 * Transcribed from the client's own catalogue covers and business card — see
 * CLIENT-FACTS.md. Anything marked TODO has not been confirmed and must not be
 * guessed at anywhere in the UI.
 */

export const SITE_URL = "https://www.mossanomarmo.com";

export const BRAND = {
  name: "MOSSANO MARMO",
  wordmark: "MOSSANO",
  trademark: "MOSSANO™",

  /** From the brief, §4 — the homepage subheading. */
  tagline: "Curated Natural Stone. Sourced Globally.",
  /** From the catalogue covers. */
  strapline: "Curators of Exceptional Natural Stone",
  poetic: "From the earth’s core to the elegance of marble surfaces",

  yearsExperience: 15,

  phones: ["9619176132", "9136116132"],
  whatsapp: "919619176132",
  email: "mossanogroup@gmail.com",

  // TODO(client): the scan of the back cover cuts off part of this line.
  // Confirm the full address before it goes anywhere public.
  address: {
    line1: "Natural Stone House, Survey No. 172",
    line2: "New Marble Market",
    city: "Kishangarh",
    state: "Rajasthan",
    postalCode: "305801",
    country: "India",
  },

  // TODO(client): what is mossanoatelier.com? A second brand, or a redirect?
  secondDomain: "www.mossanoatelier.com",
};

export const NAV = [
  { label: "New Edit", to: "/new-edit" },
  { label: "Stone", to: "/stone" },
  { label: "Shop by Look", to: "/look" },
  { label: "Applications", to: "/applications" },
  { label: "Private Sourcing", to: "/private-sourcing" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

/**
 * Click-to-chat, with the stone code passed through — the brief asks for this
 * explicitly (§14): "Hi MOSSANO, I am interested in MM-024 Calacatta Viola."
 */
export const waLink = (message) =>
  `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(message)}`;

export const waForStone = (stone, title) =>
  waLink(
    `Hi MOSSANO, I am interested in ${stone.mossanoCode ?? `Lot ${stone.lot}`} ${title}.`,
  );

export const WA_GENERAL =
  "Hi MOSSANO, I would like to enquire about your natural stone.";
