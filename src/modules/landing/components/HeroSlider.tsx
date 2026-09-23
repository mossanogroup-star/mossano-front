import { useCallback, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Slab } from "@/shared/components/Slab";
import { cn } from "@/shared/lib/cn";
import type { Media, ProcessStep } from "@/shared/api/types";

/**
 * Phase-3 feedback — the home page's first screen is the quarry-to-project
 * story, running behind the wordmark rather than beside it.
 *
 * The five photographs cross-fade in place; the hero's own content — wordmark,
 * strapline, the two calls to action, the running numbers — sits on top and
 * never moves. One screen, not two: the client was explicit that this replaces
 * the single static slab rather than adding a section under it.
 *
 * Every slide stays mounted and is faded rather than swapped, so stepping
 * through never shows a blank frame while the next image decodes. Only the
 * first loads eagerly — the rest are lazy, because on arrival only one is
 * visible and the hero is the page's largest paint.
 */
interface Props {
  steps: ProcessStep[];
  /** The pinned hero slab, used until the five step photographs are uploaded. */
  fallbackMedia?: Media | null;
  fallbackUrl?: string | null;
  children: ReactNode;
}

export function HeroSlider({ steps, fallbackMedia, fallbackUrl, children }: Props) {
  const [index, setIndex] = useState(0);
  const count = steps.length;
  const active = count > 0 ? steps[index] : null;

  const go = useCallback(
    // Wraps, so neither arrow is ever a dead end on a five-slide loop.
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
      {...(count > 1
        ? { "aria-roledescription": "carousel", "aria-label": "From the quarry to your project" }
        : {})}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
      className="relative isolate min-h-[78vh] overflow-hidden bg-umber-deep focus:outline-none short:min-h-[92vh]"
    >
      {count > 0 ? (
        steps.map((step, i) => (
          <div
            key={step.slug}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              i === index ? "opacity-100" : "opacity-0",
            )}
          >
            <Slab
              media={step.image}
              alt={i === 0 ? step.image?.alt || step.title : ""}
              aspect="auto"
              priority={i === 0}
              sizes="100vw"
              className="h-full w-full"
              imgClassName="h-full w-full object-cover"
            />
          </div>
        ))
      ) : (
        <Slab
          media={fallbackMedia}
          url={fallbackUrl}
          alt=""
          aspect="auto"
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full"
          imgClassName="h-full w-full object-cover"
        />
      )}

      {/* Text sits on the stone, so the slab is darkened rather than the type
          being given a box — DESIGN.md's rule. Weighted to the bottom-left,
          where the wordmark and the buttons actually are, and now also across
          the bottom, because the step caption and dots sit there. */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-umber-deep/90 via-umber-deep/45 to-transparent"
        aria-hidden="true"
      />
      {/* The running numbers sit on the right, which the bottom-left gradient
          leaves as bare quarry — brass on sunlit limestone is unreadable. A
          second gradient carries the darkness across, and a flat wash holds the
          middle. Still gradients over the photograph, never a panel behind the
          type. */}
      <div
        className="absolute inset-0 bg-gradient-to-l from-umber-deep/75 via-umber-deep/10 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-umber-deep/20" aria-hidden="true" />
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-umber-deep/85 to-transparent"
        aria-hidden="true"
      />

      <div className="relative">
        {children}

        {count > 1 && (
          /**
           * In the flow under the hero's content rather than pinned over it.
           * Absolutely positioned, this bar landed on top of the running
           * numbers on a phone, where the content is twice as tall as the
           * viewport minimum.
           */
          <div className="shell relative z-10 flex flex-wrap items-center gap-x-6 gap-y-4 pb-8">
            <div className="flex items-center gap-2">
              {/* Beside the dots, not at the screen edges: the right edge is
                  where the chatbot launcher sits, and at phone width an edge
                  arrow lands on the wordmark. */}
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous step"
                className="grid h-10 w-10 place-items-center border border-ivory/30 text-ivory transition-colors hover:border-ivory hover:bg-ivory hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.25} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next step"
                className="grid h-10 w-10 place-items-center border border-ivory/30 text-ivory transition-colors hover:border-ivory hover:bg-ivory hover:text-ink"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>

            <ul className="flex items-center gap-2.5">
              {steps.map((step, i) => (
                <li key={step.slug}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={step.title}
                    aria-current={i === index}
                    className={cn(
                      "h-1 w-7 transition-colors",
                      i === index ? "bg-brass-light" : "bg-ivory/30 hover:bg-ivory/60",
                    )}
                  />
                </li>
              ))}
            </ul>

            {/* aria-live so the step change is announced without the arrows
                having to describe where they lead. */}
            <p className="label text-ivory/70" aria-live="polite">
              <span className="tabular-nums text-brass-light">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mx-2 text-ivory/30">/</span>
              {active?.title}
              <span className="ml-3 hidden font-sans normal-case tracking-normal text-ivory/55 lg:inline">
                {active?.body}
              </span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
