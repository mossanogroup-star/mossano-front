/**
 * Phase-1 feedback §1 — clients and partners, in a carousel.
 *
 * Names rather than logos, deliberately. The client's brochure carries the logo
 * sheet as one flattened raster, so there are no logo files to use yet, and a
 * badly cut-out logo on a luxury site is worse than none. Every name below is
 * transcribed from that sheet — see CLIENT-FACTS.md.
 *
 * When the client supplies the files, give a partner a `logo` and the tile
 * renders the image instead; nothing else here has to change.
 */
export interface Partner {
  name: string;
  /** An asset URL once the client supplies one. */
  logo?: string;
}

const PARTNERS: Partner[] = [
  // Builders & developers
  { name: "Lodha" },
  { name: "Piramal" },
  { name: "Rustomjee" },
  { name: "The Wadhwa Group" },
  { name: "K Raheja Corp" },
  { name: "Larsen & Toubro" },
  { name: "Kalpataru" },
  { name: "Hiranandani" },
  { name: "Prestige Group" },
  { name: "Peninsula Land" },
  { name: "Lokhandwala" },
  // Hospitality
  { name: "Taj" },
  { name: "Marriott" },
  { name: "JW Marriott" },
  { name: "Radisson" },
  // Architects & interior designers
  { name: "Hafeez Contractor" },
  { name: "Gauri Khan Designs" },
  { name: "AUM Architects" },
  { name: "SJK Architects" },
  { name: "PCA Group" },
  { name: "Anjali Rawat Architects" },
  // Retail, F&B and banking
  { name: "Haldiram's" },
  { name: "Café Coffee Day" },
  { name: "Punjab Grill" },
  { name: "HDFC Bank" },
  { name: "ICICI Bank" },
  { name: "Kotak Mahindra" },
  { name: "YES Bank" },
];

function Tile({ partner }: { partner: Partner }) {
  return (
    <li className="flex shrink-0 items-center justify-center px-8">
      {partner.logo ? (
        <img
          src={partner.logo}
          alt={partner.name}
          className="h-8 w-auto opacity-60 transition-opacity hover:opacity-100"
          loading="lazy"
        />
      ) : (
        <span className="whitespace-nowrap font-display text-[0.95rem] uppercase tracking-wide text-ink-soft">
          {partner.name}
        </span>
      )}
    </li>
  );
}

export function PartnerMarquee() {
  return (
    /**
     * The track holds the list twice so the loop has somewhere to scroll to —
     * it translates by exactly -50%, which lands the copy where the original
     * started. The duplicate is aria-hidden so a screen reader reads the roster
     * once, and the whole strip is a plain list for anyone who has reduced
     * motion on, where the animation is off and the strip scrolls by hand.
     */
    <div
      className="marquee relative overflow-hidden"
      // The fade at both edges says "this continues" without a scrollbar.
      style={{
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <ul className="marquee-track flex w-max items-center py-2">
        {PARTNERS.map((partner) => (
          <Tile key={partner.name} partner={partner} />
        ))}
        {PARTNERS.map((partner) => (
          <li key={`${partner.name}-copy`} aria-hidden="true" className="contents">
            <Tile partner={partner} />
          </li>
        ))}
      </ul>
    </div>
  );
}
