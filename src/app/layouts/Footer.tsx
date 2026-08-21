import { Link } from "react-router-dom";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";

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
      { to: "/private-sourcing", label: "Private Sourcing" },
      { to: "/about", label: "About MOSSANO" },
      { to: "/contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  const { brand, whatsapp } = useSiteConfig();
  const { address } = brand;

  return (
    <footer className="bg-umber text-ivory">
      <div className="shell py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <p className="wordmark text-[1.05rem]">{brand.wordmark}</p>
            <p className="mt-4 max-w-xs text-[0.9rem] leading-relaxed text-ivory/65">
              {brand.strapline}
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="label text-ivory/45">{column.title}</p>
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
            <p className="label text-ivory/45">Contact</p>
            <address className="mt-5 space-y-1 not-italic text-[0.9rem] leading-relaxed text-ivory/75">
              <p>{address.line1}</p>
              <p>{address.line2}</p>
              <p>
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p>{address.country}</p>
            </address>

            <div className="mt-5 space-y-1 text-[0.9rem]">
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

            <WhatsAppButton href={whatsapp.general} variant="light" className="mt-7" />
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
