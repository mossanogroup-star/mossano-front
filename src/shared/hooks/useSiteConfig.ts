import { useQuery } from "@tanstack/react-query";
import { publicQueries } from "../api/publicQueries";
import type { SiteConfig } from "../api/types";

/**
 * Brand facts and taxonomies.
 *
 * Prefetched on the server for every public route, so during SSR and on first
 * paint this resolves from the dehydrated cache rather than firing a request.
 * The fallback below only applies if that prefetch failed — a footer with no
 * phone number is a worse failure than a stale one.
 */
/** Mirrors mossano-back/src/config/brand.js — change both together. */
const HEAD_OFFICE = {
  label: "Head Office",
  line1: "20 V.V. Chandan Street, 4, Kanch Wala Bldg",
  line2: "1st Floor",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400003",
  country: "India",
};

const FALLBACK: SiteConfig["brand"] = {
  name: "MOSSANO MARMO",
  wordmark: "MOSSANO",
  tagline: "Curated Natural Stone. Sourced Globally.",
  strapline: "Curators of Exceptional Natural Stone",
  phones: ["9619176132", "9136116132"],
  whatsappNumber: "919619176132",
  email: "mossanogroup@gmail.com",
  address: HEAD_OFFICE,
  locations: [
    HEAD_OFFICE,
    {
      label: "Studio",
      line1: "703, 7th Floor, Accord Classic",
      line2: "Near Goregaon Railway Station, Goregaon",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400063",
      country: "India",
    },
    {
      label: "Dubai",
      line1: "1035, 1st Floor, DBCS Building",
      line2: "Al Qusais",
      city: "Dubai",
      state: "",
      postalCode: "",
      country: "United Arab Emirates",
    },
  ],
  canonicalDomain: "www.mossanomarmo.com",
  baseUrl: "https://www.mossanomarmo.com",
};

export function useSiteConfig() {
  const { data } = useQuery(publicQueries.config());
  return {
    brand: data?.brand ?? FALLBACK,
    whatsapp: data?.whatsapp ?? {
      general: `https://wa.me/${FALLBACK.whatsappNumber}`,
      number: FALLBACK.whatsappNumber,
    },
    taxonomies: data?.taxonomies,
  };
}
