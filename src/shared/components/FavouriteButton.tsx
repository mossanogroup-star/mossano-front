import { Heart } from "lucide-react";
import { useFavourites } from "../hooks/useFavourites";
import { cn } from "../lib/cn";

interface Props {
  slug: string;
  name: string;
  className?: string;
  tone?: "dark" | "light";
  withLabel?: boolean;
}

/**
 * Website §5 — save a stone with no account, on this device.
 *
 * The label is explicit ("Save to favourites" / "Saved") rather than relying on
 * the heart alone: the icon's filled and unfilled states are a weak signal at
 * this size, and the control is often sitting on top of a photograph where a
 * subtle difference disappears entirely.
 */
export function FavouriteButton({
  slug,
  name,
  className,
  tone = "dark",
  withLabel = false,
}: Props) {
  const { has, toggle } = useFavourites();
  const saved = has(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        // Cards wrap the whole tile in a link; without this, saving navigates.
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
      className={cn(
        "inline-flex items-center gap-2 transition-colors duration-200",
        withLabel && "font-sans text-[0.66rem] uppercase tracking-label",
        tone === "light"
          ? "text-ivory/70 hover:text-ivory"
          : "text-ink-faint hover:text-ink",
        saved && (tone === "light" ? "text-brass-light" : "text-brass"),
        className,
      )}
    >
      <Heart
        className="h-4 w-4"
        strokeWidth={1.25}
        fill={saved ? "currentColor" : "none"}
        aria-hidden="true"
      />
      {withLabel && <span>{saved ? "Saved" : "Save to favourites"}</span>}
    </button>
  );
}
