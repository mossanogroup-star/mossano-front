import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

/**
 * Screenshots every page at desktop and phone size, and measures the one thing
 * that cannot be judged by eye: whether the hero's type is legible over the
 * stone. Ivory type is L≈0.93, so the band beneath it wants to be dark and calm.
 *
 * ⚠ The glyphs and the gradient are both hidden before sampling. Leave either
 * in and you measure the overlay, not the slab — which is how a 0.73 beige
 * scored 0.33 and passed.
 *
 *   mean   average luminance behind the text
 *   p95    the brightest 5% — one bright vein ruins legibility
 *   stdev  how busy it is
 */
const BASE = process.env.BASE ?? "http://localhost:5000";
const OUT = path.resolve("audit-shots");

const ROUTES = [
  ["home", "/"],
  ["new-edit", "/new-edit"],
  ["shop", "/shop"],
  ["shop-filtered", "/shop?look=dark-moody"],
  ["look-index", "/look"],
  ["look-detail", "/look/dark-moody"],
  ["application-index", "/application"],
  ["favourites", "/favourites"],
  ["private-sourcing", "/private-sourcing"],
  ["about", "/about"],
  ["contact", "/contact"],
];

const VIEWPORTS = [
  ["desktop", { width: 1440, height: 900 }],
  ["phone", { width: 390, height: 844 }],
];

const findings = [];
const note = (severity, page, message) => {
  findings.push({ severity, page, message });
  console.log(
    `  ${severity === "high" ? "✗" : severity === "med" ? "!" : "·"} ${page}: ${message}`,
  );
};

/** Perceptual luminance, 0–1. */
const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/**
 * Luminance statistics for one region of a PNG buffer.
 * `region` is a fraction of the image: { left, top, width, height } in 0–1.
 */
async function bandStats(pngBuffer, region) {
  const image = sharp(pngBuffer);
  const { width, height } = await image.metadata();

  const extract = {
    left: Math.round(region.left * width),
    top: Math.round(region.top * height),
    width: Math.max(1, Math.round(region.width * width)),
    height: Math.max(1, Math.round(region.height * height)),
  };

  const { data, info } = await image
    .extract(extract)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const values = [];
  for (let i = 0; i < data.length; i += info.channels) {
    values.push(luma(data[i], data[i + 1], data[i + 2]));
  }
  values.sort((a, b) => a - b);

  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;

  return {
    mean,
    p95: values[Math.floor(values.length * 0.95)],
    stdev: Math.sqrt(variance),
  };
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
console.log(`\nMOSSANO visual audit — ${BASE}\n`);

for (const [vpName, viewport] of VIEWPORTS) {
  console.log(`── ${vpName} ${viewport.width}×${viewport.height} ──`);
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });

  page.on("pageerror", (e) => note("high", vpName, `page error: ${e.message.slice(0, 90)}`));

  for (const [name, route] of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    // Let lazy images and fonts settle before the shot.
    await page.waitForTimeout(900);

    await page.screenshot({
      path: path.join(OUT, `${vpName}-${name}.png`),
      fullPage: false,
    });

    // Any image that failed to load, or is being scaled up beyond its source.
    const imageProblems = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.complete)
        .map((img) => ({
          src: img.currentSrc || img.src,
          broken: img.naturalWidth === 0,
          // Measured against the rendition the browser actually selected, read
          // out of the Cloudinary transform in currentSrc.
          //
          // naturalWidth is the obvious source for this and it is not reliable
          // here: in headless Chromium it reported 390 for an image whose URL
          // demonstrably returns 800x486 to every user agent, which produced a
          // page of false "2x upscale" findings. The requested width is stated
          // in the URL, so it needs no decoding and cannot drift.
          //
          // Device pixels, not CSS pixels — on a 2x screen a 1440px-wide hero
          // needs 2880px of source.
          ...(() => {
            const chosen = Number((img.currentSrc || "").match(/[/,]w_(\d+)/)?.[1] ?? 0);
            const needed = img.clientWidth * window.devicePixelRatio;
            // The largest rendition on offer. Cloudinary caps these at the
            // source's own width with c_limit, so this is the ceiling of what
            // the photograph physically contains.
            const largest = Math.max(
              0,
              ...(img.getAttribute("srcset") || "")
                .split(",")
                .map((c) => Number(/\s(\d+)w\s*$/.exec(c)?.[1] ?? 0)),
            );
            if (!chosen || !needed) return { upscale: 1, exhausted: false };
            return {
              upscale: +(needed / chosen).toFixed(2),
              // Already serving every pixel that exists. A shortfall here is a
              // limit of the photograph, not of the markup.
              exhausted: largest > 0 && chosen >= largest,
              largest,
              needed: Math.round(needed),
            };
          })(),
          alt: img.alt,
        }))
        .filter((i) => i.broken || i.upscale > 1.6 || i.alt === undefined),
    );

    for (const p of imageProblems) {
      if (p.broken) note("high", `${vpName}/${name}`, `broken image ${p.src.slice(-46)}`);
      // Two different findings wear the same symptom. A rendition smaller than
      // the ones on offer is a srcset or sizes bug and is fixable in code.
      // Having served the largest rendition there is means the source
      // photograph is simply smaller than the display — only new photography
      // fixes that, so it is recorded rather than raised, and a real regression
      // in the first case stays visible instead of hiding behind it.
      else if (p.exhausted)
        note(
          "low",
          `${vpName}/${name}`,
          `source is only ${p.largest}px, display wants ${p.needed}px — needs a larger original, not a code change (${p.src.slice(-30)})`,
        );
      else note("med", `${vpName}/${name}`, `image upscaled ${p.upscale}× — ${p.src.slice(-46)}`);
    }

    // Horizontal overflow, which on a phone is the difference between a premium
    // site and a broken one.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 2) note("high", `${vpName}/${name}`, `${overflow}px horizontal overflow`);
  }

  // The hero, measured
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const hero = page.locator("section").first();

  // Hide the type AND the gradient overlay.
  //
  // Hiding only the type was the first version, and it was measuring the wrong
  // thing entirely: the dark overlay sat on top, so a bright beige slab scored
  // 0.33 and looked fine, when the stone underneath was 0.73. The overlay is
  // found by computed style rather than by class, so restyling the hero cannot
  // silently disable the check.
  await page.evaluate(() => {
    const section = document.querySelector("section");
    if (!section) return;
    section.querySelectorAll("h1, p, a, .rule").forEach((el) => (el.style.visibility = "hidden"));
    section.querySelectorAll("div").forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg.includes("gradient")) el.style.display = "none";
    });
  });
  await page.waitForTimeout(200);

  const bare = await hero.screenshot();

  // The band the heading and tagline actually occupy: lower-left of the hero.
  const stats = await bandStats(bare, {
    left: 0.03,
    top: 0.55,
    width: 0.55,
    height: 0.42,
  });

  console.log(`\n  hero legibility (${vpName}), glyphs hidden:`);
  console.log(
    `    mean luminance  ${stats.mean.toFixed(3)}   (ivory type is 0.93 — wants to be dark)`,
  );
  console.log(`    brightest 5%    ${stats.p95.toFixed(3)}`);
  console.log(
    `    variance        ${stats.stdev.toFixed(3)}   (busy stone is as unreadable as bright stone)`,
  );

  if (stats.mean > 0.42) {
    note(
      "high",
      `${vpName}/hero`,
      `too bright behind the type — mean ${stats.mean.toFixed(3)}, wants < 0.42`,
    );
  }
  if (stats.p95 > 0.72) {
    note(
      "med",
      `${vpName}/hero`,
      `bright highlights behind the type — p95 ${stats.p95.toFixed(3)}`,
    );
  }
  // Variance only hurts when the slab is not already dark. Strong veining on a
  // near-black stone is the drama the hero exists for — Black Forest reads at
  // 0.23 variance because its mean is 0.18. Flagging that would push the site
  // back towards the flat beige slab this check was written to catch.
  if (stats.stdev > 0.19 && stats.mean > 0.3) {
    note(
      "med",
      `${vpName}/hero`,
      `busy AND light behind the type — variance ${stats.stdev.toFixed(3)}, mean ${stats.mean.toFixed(3)}`,
    );
  }

  await page.screenshot({
    path: path.join(OUT, `${vpName}-hero-measured.png`),
  });
  await page.close();
  console.log("");
}

await browser.close();

console.log("─".repeat(60));
const high = findings.filter((f) => f.severity === "high");
const med = findings.filter((f) => f.severity === "med");
const low = findings.filter((f) => f.severity === "low");
console.log(
  `${high.length} serious, ${med.length} worth fixing, ${low.length} limited by source material.` +
    `  Screenshots in audit-shots/`,
);
console.log("");
