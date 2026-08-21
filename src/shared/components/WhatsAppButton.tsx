import { cn } from "../lib/cn";

interface Props {
  /** A wa.me URL, always built on the server so it works without JavaScript. */
  href: string;
  label?: string;
  className?: string;
  variant?: "solid" | "outline" | "light" | "quiet";
}

/** The WhatsApp glyph, inline so the button needs no icon font or extra request. */
function WhatsAppGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.19 1.87.12.57-.08 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.87 9.87 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.14h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.22-8.24 8.22z" />
    </svg>
  );
}

/**
 * Admin Scope §8 — WhatsApp from Home, Stone Detail, Private Sourcing, Private
 * Selection and Contact, with the MOSSANO code already in the message.
 *
 * A plain anchor, never a click handler. The href arrives pre-composed from the
 * server, so it is in the HTML a crawler reads and it works with JavaScript
 * disabled — which matters here more than usual, because WhatsApp is where
 * these links get opened in the first place.
 */
export function WhatsAppButton({
  href,
  label = "WhatsApp MOSSANO",
  className,
  variant = "solid",
}: Props) {
  const styles = {
    solid: "btn-wa",
    outline: "btn-outline",
    light: "btn-light",
    quiet:
      "inline-flex items-center gap-2 font-sans text-[0.66rem] uppercase tracking-label text-ink-soft transition-colors hover:text-whatsapp",
  }[variant];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(styles, className)}
    >
      <WhatsAppGlyph />
      <span>{label}</span>
    </a>
  );
}
