/**
 * Phase-2 feedback §3 — an Instagram post or reel on a project page.
 *
 * An iframe against Instagram's own /embed endpoint, not their embed.js. The
 * script would load third-party JavaScript into every project page and rewrite
 * the DOM after hydration, which is the exact pattern that causes hydration
 * mismatches here. The iframe renders identically on the server and the client
 * because it is just markup.
 *
 * `lazy` matters: a project with six reels would otherwise open six connections
 * to Instagram before the first photograph below the fold has loaded.
 */

/** The shortcode from /p/, /reel/ or /tv/ — null for anything else. */
function instagramShortcode(url: string): string | null {
  const match = /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i.exec(url);
  return match ? match[1] : null;
}

export function InstagramEmbed({ url }: { url: string }) {
  const code = instagramShortcode(url);

  // A link that is not an embeddable post still reaches the profile or page the
  // team pasted, rather than rendering an empty box.
  if (!code) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="label underline-offset-4 hover:underline"
      >
        View on Instagram
      </a>
    );
  }

  return (
    <div className="bg-ivory-deep">
      <iframe
        src={`https://www.instagram.com/p/${code}/embed/`}
        title="Instagram post"
        loading="lazy"
        allowFullScreen
        // Instagram's embed is a fixed-width column; 480 is the height at which
        // the caption stops being clipped on a phone.
        className="h-[480px] w-full border-0"
        // Their embed sets its own cookies; keep it from reaching back here.
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
