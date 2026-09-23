import { Link } from "react-router-dom";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { Wordmark } from "@/shared/components/Wordmark";
import type { BrandLocation } from "@/shared/api/types";

/** "Mumbai, Maharashtra 400003" — and just "Dubai" where the rest is absent. */
const cityLine = ({ city, state, postalCode }: BrandLocation) =>
  [[city, state].filter(Boolean).join(", "), postalCode].filter(Boolean).join(" ");

const COLUMNS = [
  {
    title: "Browse",
    links: [
      { to: "/new-edit", label: "New Edit" },
      { to: "/shop", label: "Stone Shop" },
      { to: "/look", label: "Shop by Look" },
      { to: "/application", label: "Shop by Application" },
      { to: "/favourites", label: "Favourites" },
    ],
  },
  {
    title: "Services",
    links: [
      { to: "/private-sourcing", label: "Personalize Sourcing" },
      { to: "/projects", label: "Projects" },
      { to: "/clients", label: "Clients" },
      { to: "/about", label: "About MOSSANO" },
      { to: "/contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  const { brand } = useSiteConfig();
  const { locations } = brand;

  return (
    <footer className="bg-umber text-ivory">
      <div className="shell py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1.4fr]">
          <div>
            <Wordmark text={brand.wordmark} tm className="block text-[1.05rem]" />
            <p className="mt-4 max-w-xs text-[0.9rem] leading-relaxed text-ivory/65">
              {brand.strapline}
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-display text-[1.35rem] uppercase leading-none tracking-wide text-ivory">
                {column.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-block py-1 text-[0.9rem] text-ivory/75 transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="font-display text-[1.35rem] uppercase leading-none tracking-wide text-ivory">
              Contact
            </h2>

            {/* Phase-3 feedback — all three offices, not just the head office.
                They were already in the brand config and already on the Contact
                page; the footer was the only place showing one of them. */}
            <div className="mt-5 space-y-5">
              {locations.map((location) => (
                <address
                  key={location.label}
                  className="space-y-0.5 not-italic text-[0.9rem] leading-relaxed text-ivory/75"
                >
                  <p className="label text-ivory/45">{location.label}</p>
                  <p>{location.line1}</p>
                  {location.line2 && <p>{location.line2}</p>}
                  <p>{cityLine(location)}</p>
                  <p>{location.country}</p>
                </address>
              ))}
            </div>

            <div className="mt-6 space-y-1 text-[0.9rem]">
              {brand.phones.map((phone) => (
                <p key={phone}>
                  <a
                    href={`tel:+91${phone}`}
                    className="inline-block py-1 text-ivory/75 transition-colors hover:text-ivory"
                  >
                    +91 {phone}
                  </a>
                </p>
              ))}
              <p>
                <a
                  href={`mailto:${brand.email}`}
                  className="inline-block py-1 text-ivory/75 transition-colors hover:text-ivory"
                >
                  {brand.email}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ivory/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.7rem] uppercase tracking-label text-ivory/40">
            © {new Date().getFullYear()} {brand.name}
          </p>
          <p className="text-[0.75rem] uppercase tracking-label text-ivory/40">{brand.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
