import { Heart } from "lucide-react";
import { useFavourites } from "../hooks/useFavourites";
import { cn } from "../lib/cn";

interface Props {
  slug: string;
  name: string;
  className?: string;
  tone?: "dark" | "light";
  withLabel?: boolean;
  /**
   * "button" draws it as an outline button beside the stone page's other
   * actions. Passing `btn-outline` as a className instead did not work: the
   * icon link's own -m-2/p-2, grey text and hover:text-ink overrode it, so the
   * button spilled out of its cell and its label went dark on the dark hover.
   */
  variant?: "icon" | "button";
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
  variant = "icon",
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
        variant === "button"
          ? cn("btn-outline", saved && "border-brass text-brass hover:border-ink hover:text-ivory")
          : cn(
              // -m-2/p-2 grows the tap area to ~44px without moving anything: at
              // 16x16 the icon was a thumb-sized miss on a phone, and this is one of
              // the two actions the card exists for.
              "-m-2 inline-flex items-center gap-2 p-2 transition-colors duration-200",
              withLabel && "font-sans text-[0.66rem] uppercase tracking-label",
              tone === "light" ? "text-ivory/70 hover:text-ivory" : "text-ink-faint hover:text-ink",
              saved && (tone === "light" ? "text-brass-light" : "text-brass"),
            ),
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
