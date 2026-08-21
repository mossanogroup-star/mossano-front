/**
 * Write every route to disk as real HTML.
 *
 * This is a React SPA, so what it would otherwise serve is an empty
 * `<div id="root">`. Google usually executes JavaScript; Bing, the AI crawlers
 * and — the one that matters most here — WhatsApp's and Instagram's link
 * preview fetchers mostly do not. The brief says architects will discover
 * stones "through Instagram/WhatsApp on mobile", so a forwarded link that
 * previews as a blank page is a direct commercial loss.
 *
 * Rendering runs through react-dom/server against the SSR bundle Vite emits —
 * no headless browser, nothing to install on a build machine, deterministic
 * output. React hydrates over the top, so the site stays interactive.
 *
 * Every stone gets its own page, so each one is independently shareable and
 * indexable. Fails the build rather than shipping blank pages.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SSR_ENTRY = join(ROOT, "dist-ssr", "entry-server.js");

async function main() {
  let mod;
  try {
    mod = await import(pathToFileURL(SSR_ENTRY).href);
  } catch (err) {
    console.error(
      '✗ could not load dist-ssr/entry-server.js — run "npm run build:ssr" first.',
    );
    console.error(`  ${err.message}`);
    process.exit(1);
  }

  const template = await readFile(join(DIST, "index.html"), "utf8");
  if (!template.includes('<div id="root"></div>')) {
    console.error(
      '✗ dist/index.html has no empty <div id="root"></div> to fill.',
    );
    process.exit(1);
  }

  const urls = mod.routes();
  let thin = 0;

  for (const url of urls) {
    const markup = mod.render(url);

    if (!markup || markup.length < 2000) {
      console.error(
        `✗ ${url} rendered only ${markup?.length ?? 0} chars — aborting.`,
      );
      process.exit(1);
    }

    const html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${markup}</div>`,
    );
    const dir = url === "/" ? DIST : join(DIST, url);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), html, "utf8");
    if (markup.length < 8000) thin += 1;
  }

  console.log(`✓ prerendered ${urls.length} routes`);
  if (thin)
    console.log(`  (${thin} are short pages — expected for application stubs)`);
}

main().catch((err) => {
  console.error("✗ prerender failed:", err);
  process.exit(1);
});
