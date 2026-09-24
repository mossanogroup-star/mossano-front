import { Flag } from "./Flag";
import { cn } from "../lib/cn";

/**
 * The factory countries the positioning statement names, in its order. Written
 * here rather than read from the catalogue: they are where MOSSANO has
 * partners, not where current stock happens to come from.
 */
const FACTORY_COUNTRIES = [
  { code: "it", label: "Italy" },
  { code: "tr", label: "Turkey" },
  { code: "gr", label: "Greece" },
  { code: "br", label: "Brazil" },
  { code: "vn", label: "Vietnam" },
  { code: "cn", label: "China" },
];

/**
 * Phase-3 feedback — each flag with its country's name under it. The name is
 * the text, so the flag image itself is left without alt.
 */
export function CountryFlags({
  countries = FACTORY_COUNTRIES,
  className = "mt-8",
}: {
  countries?: Array<{ code: string; label: string }>;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid max-w-[20rem] grid-cols-3 gap-x-6 gap-y-5 sm:flex sm:max-w-none sm:flex-wrap",
        className,
      )}
    >
      {countries.map((country) => (
        <li key={country.code} className="flex flex-col items-center gap-2">
          <span className="text-[1.6rem] leading-none">
            <Flag code={country.code} />
          </span>
          <span className="label text-ivory/70">{country.label}</span>
        </li>
      ))}
    </ul>
  );
}
