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
const FALLBACK: SiteConfig["brand"] = {
  name: "MOSSANO MARMO",
  wordmark: "MOSSANO",
  tagline: "Curated Natural Stone. Sourced Globally.",
  strapline: "Curators of Exceptional Natural Stone",
  phones: ["9619176132", "9136116132"],
  whatsappNumber: "919619176132",
  email: "mossanogroup@gmail.com",
  address: {
    line1: "Natural Stone House, Survey No. 172",
    line2: "New Marble Market",
    city: "Kishangarh",
    state: "Rajasthan",
    postalCode: "305801",
    country: "India",
  },
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
