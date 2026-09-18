import { ClientLogo } from "./ClientLogo";
import type { ClientTile } from "@/shared/api/types";

/**
 * Phase-2 feedback §2 — every client logo in one continuously moving strip.
 *
 * The roster comes from the CRM, not from this file: §"Important" is explicit
 * that the team adds a client without a code change. Phase 1 shipped this with
 * names hardcoded because there were no logo files; there are now.
 */
export function PartnerMarquee({ clients }: { clients: ClientTile[] }) {
  if (clients.length === 0) return null;

  return (
    /**
     * The track holds the roster twice and travels exactly -50%, which lands
     * the copy where the original began, so the loop has no seam. The duplicate
     * is aria-hidden: a screen reader should hear the roster once.
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
        {clients.map((client) => (
          <li key={client.id} className="flex w-[180px] shrink-0 justify-center px-6">
            <ClientLogo client={client} />
          </li>
        ))}
        {clients.map((client) => (
          <li
            key={`${client.id}-copy`}
            aria-hidden="true"
            className="flex w-[180px] shrink-0 justify-center px-6"
          >
            <ClientLogo client={client} />
          </li>
        ))}
      </ul>
    </div>
  );
}
