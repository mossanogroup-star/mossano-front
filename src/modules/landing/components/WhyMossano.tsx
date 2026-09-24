import { Link } from "react-router-dom";
import { Slab } from "@/shared/components/Slab";
import type { ProcessStep } from "@/shared/api/types";

/**
 * The hero's second slide — "Why MOSSANO", built to the client's reference
 * image: heading and statement on the left, the five process photographs in a
 * row joined by arrows, each with its number, title and line of copy beneath.
 *
 * On a phone the row scrolls sideways instead of stacking five tall cards. The
 * touch handlers stop there so dragging the row does not also flip the slide.
 */
export function WhyMossano({ steps }: { steps: ProcessStep[] }) {
  const stop = (event: React.TouchEvent) => event.stopPropagation();

  return (
    // The catalogues' brown, as in the reference — a shade lighter than the
    // slab slide's frame.
    <div className="flex flex-1 flex-col bg-umber">
      <div className="shell relative flex flex-1 flex-col justify-center pb-[4.5rem] pt-6 max-sm:tiny:pb-14 max-sm:tiny:pt-4 sm:pb-24 sm:pt-10 short:lg:pt-6">
        <div className="rule max-sm:tiny:hidden" />
        <p className="mt-3 font-display text-[0.72rem] uppercase max-sm:tiny:mt-0 sm:mt-4 tracking-label text-brass-light sm:text-[0.95rem]">
          MOSSANO MARMO
        </p>
        <h2 className="mt-1.5 font-display text-[1.6rem] uppercase min-[375px]:text-[1.85rem] max-sm:tiny:text-[1.5rem] leading-none tracking-wide text-ivory sm:text-[3rem] lg:text-[3.75rem] short:lg:text-[3rem]">
          Why MOSSANO
        </h2>
        <p className="mt-3 max-w-4xl text-[0.8rem] leading-relaxed max-sm:tiny:mt-2 max-sm:tiny:text-[0.76rem] max-sm:tiny:leading-snug text-ivory/80 sm:mt-5 sm:text-[1rem] lg:text-[1.1rem]">
          MOSSANO MARMO sources marble, granite and natural stone from quarries worldwide and
          curates what is worth specifying. Every lot is photographed as it actually is, and its
          availability is verified rather than assumed.
        </p>

        <ol
          onTouchStart={stop}
          onTouchEnd={stop}
          className="-mx-5 mt-5 flex max-sm:tiny:mt-3 scroll-px-5 snap-x snap-mandatory gap-4 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-6 sm:overflow-visible sm:px-0 lg:mt-8 lg:gap-11 short:lg:mt-6"
        >
          {steps.map((step, i) => (
            <li key={step.slug} className="w-[42%] shrink-0 snap-start text-center sm:w-auto">
              <div className="relative">
                <Slab
                  media={step.image}
                  alt={step.image?.alt || step.title}
                  aspect="auto"
                  sizes="(min-width: 640px) 18vw, 42vw"
                  className="aspect-[4/3] w-full max-sm:tiny:aspect-[16/10] sm:aspect-[15/16] short:lg:aspect-[6/5]"
                  imgClassName="h-full w-full object-cover"
                />
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-full top-1/2 hidden w-6 -translate-y-1/2 text-center text-ivory/70 sm:block lg:w-11"
                  >
                    &rarr;
                  </span>
                )}
              </div>
              <span className="mx-auto mt-3 grid h-6 w-6 text-[0.7rem] max-sm:tiny:mt-2 sm:mt-5 sm:h-8 sm:w-8 place-items-center rounded-full border border-ivory/70 font-display text-ivory sm:text-[0.8rem]">
                {i + 1}
              </span>
              <h3 className="mt-2.5 font-display max-sm:tiny:mt-1.5 text-[0.68rem] uppercase tracking-label text-ivory sm:mt-4 lg:text-[0.9rem]">
                {step.title}
              </h3>
              <div className="mx-auto mt-2 h-px w-8 bg-brass sm:mt-3 sm:w-10" />
              <p className="mx-auto mt-2 max-w-[15rem] text-[0.74rem] max-sm:tiny:leading-snug leading-relaxed text-ivory/75 sm:mt-4 lg:text-[0.9rem]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-end justify-between gap-6 max-sm:tiny:mt-3 sm:mt-6 lg:mt-8">
          <Link to="/about" className="btn-light max-sm:tiny:py-2.5">
            About MOSSANO
          </Link>
          <p className="hidden font-display text-[1.75rem] leading-none tracking-wide text-ivory sm:block">
            MOSSANO<sup className="ml-0.5 text-[0.35em]">&trade;</sup>
          </p>
        </div>
      </div>
    </div>
  );
}
