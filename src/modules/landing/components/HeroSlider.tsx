import { useCallback, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/**
 * Phase-3 feedback — the home page's first screen is two slides: the black
 * slab under the wordmark, then the "Why MOSSANO" process panel laid out as the
 * client's reference image.
 *
 * The slides share one grid cell, so the section is as tall as the taller of
 * the two and neither jumps the page when it fades in. Both stay mounted and
 * are faded rather than swapped, so stepping never shows a blank frame while an
 * image decodes. `invisible` on the hidden one keeps its links out of the tab
 * order and the accessibility tree.
 */
export interface HeroSlide {
  key: string;
  /** Read out and shown beside the dots. */
  label: string;
  content: ReactNode;
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback(
    (delta: number) => setIndex((current) => (current + delta + count) % count),
    [count],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (count < 2) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  };

  // A horizontal drag of more than 40px is a swipe; anything less is a tap
  // that happened to move.
  const [touchX, setTouchX] = useState<number | null>(null);

  return (
    <section
      {...(count > 1 ? { "aria-roledescription": "carousel", "aria-label": "MOSSANO MARMO" } : {})}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
      /**
       * `svh`, not `vh`: on iOS `vh` is the height with the browser chrome
       * hidden, so a viewport-height hero plus the 4rem header overflowed the
       * window it was supposed to fit.
       *
       * `minmax(0,1fr)`, not the implicit `auto` column: auto grows to the
       * slides' min-content, so the scrolling step row on a phone widened the
       * whole hero past the screen and clipped the copy at the right edge.
       */
      className="relative isolate grid min-h-[calc(100svh-4rem)] grid-cols-[minmax(0,1fr)] overflow-hidden bg-umber-deep focus:outline-none lg:min-h-[78vh] short:lg:min-h-[92vh]"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.key}
          className={cn(
            "relative col-start-1 row-start-1 flex flex-col transition-[opacity,visibility] duration-700 ease-out",
            i === index ? "visible opacity-100" : "invisible opacity-0",
          )}
        >
          {slide.content}
        </div>
      ))}

      {count > 1 && (
        /**
         * Pinned to the bottom edge; each slide reserves the space for it with
         * its own bottom padding, so it never lands on the running numbers.
         * Beside the dots, not at the screen edges: the right edge is where the
         * chatbot launcher sits.
         */
        <div className="shell absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center gap-x-5 gap-y-3 pb-6 max-sm:tiny:pb-3 sm:gap-x-6 sm:pb-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous slide"
              className="grid h-9 w-9 place-items-center border border-ivory/30 text-ivory transition-colors hover:border-ivory hover:bg-ivory hover:text-ink sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next slide"
              className="grid h-9 w-9 place-items-center border border-ivory/30 text-ivory transition-colors hover:border-ivory hover:bg-ivory hover:text-ink sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </div>

          <ul className="flex items-center gap-2.5">
            {slides.map((slide, i) => (
              <li key={slide.key}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={slide.label}
                  aria-current={i === index}
                  className={cn(
                    "h-1 w-5 transition-colors sm:w-7",
                    i === index ? "bg-brass-light" : "bg-ivory/30 hover:bg-ivory/60",
                  )}
                />
              </li>
            ))}
          </ul>

          {/* Hidden on a phone, where it wrapped under the Sourcing Desk
              launcher; the dots carry the position there. */}
          <p className="label hidden text-ivory/70 sm:block" aria-live="polite">
            <span className="tabular-nums text-brass-light">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="mx-2 text-ivory/30">/</span>
            {slides[index]?.label}
          </p>
        </div>
      )}
    </section>
  );
}
