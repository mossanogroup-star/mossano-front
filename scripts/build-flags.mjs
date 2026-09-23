/**
 * Renders the country flags the storefront serves, from the `flag-icons`
 * package into public/flags as WebP.
 *
 * Why not ship the SVGs. A flag on this site is never wider than a line of
 * text — 24px beside an origin, a little more in the home page's row — and at
 * that size vector is the wrong format: Spain's flag is 91KB of coat-of-arms
 * paths to draw something the width of a fingernail. The whole set was 2.5MB.
 * Rendered once at 48×36 (2× for retina) it is well under 1KB a flag, and a
 * page showing six of them moves about 4KB.
 *
 * Nothing here is committed: public/flags is gitignored and this runs before
 * every build and before `npm run dev`, so the folder cannot go stale or drift
 * from the country list the API serves — both are derived from this package.
 *
 *   npm run flags          # rebuild the folder
 *   npm run flags -- --force
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

// Resolved through the package rather than by path so a hoisted or nested
// node_modules layout both work.
const SOURCE = path.join(path.dirname(require.resolve("flag-icons/package.json")), "flags/4x3");
const OUT = path.join(ROOT, "public/flags");

/** 2× the 24×18 the site draws. Bigger buys nothing a phone can show. */
const WIDTH = 48;
const HEIGHT = 36;

const FORCE = process.argv.includes("--force");

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * ISO 3166-1 alpha-2 only. The package also ships subdivisions (gb-eng),
 * private-use codes and flags for things that are not countries; Intl echoing
 * the code back is what identifies them.
 */
function isCountry(code) {
  if (!/^[a-z]{2}$/.test(code)) return false;
  const upper = code.toUpperCase();
  const name = displayNames.of(upper);
  return Boolean(name) && name !== upper;
}

const codes = fs
  .readdirSync(SOURCE)
  .filter((file) => file.endsWith(".svg"))
  .map((file) => file.replace(/\.svg$/, ""))
  .filter(isCountry);

if (codes.length < 100) {
  throw new Error(`Only ${codes.length} flags found in ${SOURCE} — the package looks wrong.`);
}

fs.mkdirSync(OUT, { recursive: true });

// Anything in the folder that is no longer a flag we render — a leftover from
// the SVG era, or a country the package dropped.
const expected = new Set(codes.map((code) => `${code}.webp`));
for (const file of fs.readdirSync(OUT)) {
  if (!expected.has(file)) fs.rmSync(path.join(OUT, file), { force: true });
}

let written = 0;
let skipped = 0;

await Promise.all(
  codes.map(async (code) => {
    const target = path.join(OUT, `${code}.webp`);

    // Incremental: `npm run dev` runs this too, and re-encoding 255 files on
    // every start is a second of nothing useful.
    if (!FORCE && fs.existsSync(target)) {
      skipped += 1;
      return;
    }

    await sharp(path.join(SOURCE, `${code}.svg`), { density: 300 })
      .resize(WIDTH, HEIGHT, { fit: "fill" })
      .webp({ quality: 88, effort: 6 })
      .toFile(target);

    written += 1;
  }),
);

const bytes = fs
  .readdirSync(OUT)
  .reduce((total, file) => total + fs.statSync(path.join(OUT, file)).size, 0);

console.log(
  `flags: ${written} written, ${skipped} already current — ${codes.length} countries, ${(
    bytes / 1024
  ).toFixed(0)}KB total`,
);
