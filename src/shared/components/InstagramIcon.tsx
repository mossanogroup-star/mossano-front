import { useId } from "react";
import { cn } from "../lib/cn";

/**
 * Client request (10 Oct 2026) — the real Instagram mark beside both accounts,
 * in its own gradient, not a line icon. Inline like the WhatsApp glyph, so it
 * needs no icon font or extra request. `useId` keeps the gradient id unique when
 * the two accounts render side by side, and matches between SSR and hydration.
 */
export function InstagramIcon({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="30%" cy="107%" r="150%">
          <stop offset="0" stopColor="#fdf497" />
          <stop offset="0.05" stopColor="#fdf497" />
          <stop offset="0.45" stopColor="#fd5949" />
          <stop offset="0.6" stopColor="#d6249f" />
          <stop offset="0.9" stopColor="#285aeb" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6" fill={`url(#${id})`} />
      <rect
        x="5.5"
        y="5.5"
        width="13"
        height="13"
        rx="3.8"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.3" cy="7.7" r="0.95" fill="#fff" />
    </svg>
  );
}
