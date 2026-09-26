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
 *
 * Phase-3 feedback — cropped to the media alone, so the reel reads as a compact
 * tile with no scrollbar. Instagram's embed puts a 54px profile header above
 * the media and renders the media at 4:5 of its width at every size measured
 * (170–380px); the frame is shifted up by the header and clipped at 4:5.
 *
 * Instagram's play button and label are a fixed size inside the frame, so on a
 * two-column phone grid they swamped a 165px tile. Below 326px — Instagram's own
 * minimum embed width — the frame renders at 326 and is scaled down to fit, so
 * everything inside shrinks together.
 */
import { useEffect, useRef, useState } from "react";

const MIN_WIDTH = 326;
const HEADER = 54;

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

  return <InstagramTile code={code} />;
}

function InstagramTile({ code }: { code: string }) {
  const box = useRef<HTMLDivElement>(null);
  // Measured, so null on the server: the frame mounts after hydration at the
  // right size instead of flashing at the wrong one.
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const frameWidth = Math.max(width ?? 0, MIN_WIDTH);
  const scale = (width ?? 0) / frameWidth;

  return (
    <div ref={box} className="relative aspect-[4/5] overflow-hidden bg-ink">
      {width !== null && (
        <iframe
          src={`https://www.instagram.com/p/${code}/embed/`}
          title="Instagram post"
          loading="lazy"
          allowFullScreen
          scrolling="no"
          className="absolute left-0 top-0 origin-top-left border-0"
          style={{
            width: frameWidth,
            height: HEADER + frameWidth * 1.25,
            transform: `scale(${scale}) translateY(-${HEADER}px)`,
          }}
          // Their embed sets its own cookies; keep it from reaching back here.
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  );
}
