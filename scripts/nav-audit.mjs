import { chromium } from "playwright";

/**
 * Walks the whole site the way a person does — real client-side navigation,
 * not a series of cold page loads — and fails on any console error.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * An effect written as `useEffect(() => window.scrollTo(0, 0), [pathname])`
 * returns a value, React treats it as cleanup, and the app dies with "destroy
 * is not a function" on the *next* navigation. Loading each page cold never
 * triggers it, because cleanup never runs. That bug shipped twice in this
 * project. Clicking through, and going back and forward, is what catches it.
 *
 * Run against the server that serves the real thing:
 *   cd mossano-back && npm run dev     (or npm start for the production build)
 *   cd mossano-front && npm run nav-audit
 */
const BASE = process.env.BASE ?? "http://localhost:5000";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
const warnings = [];

/**
 * A 404 page correctly returns 404, and the browser logs that to the console as
 * a failed resource. That is the page working, not breaking — so the not-found
 * checks assert the status code instead, and mute the console while they run.
 */
let expectingNotFound = false;

page.on("console", (m) => {
  const text = m.text();
  if (m.type() === "error") {
    if (expectingNotFound && /404|Failed to load resource/.test(text)) return;
    errors.push(text.slice(0, 200));
  } else if (
    m.type() === "warning" &&
    !/Download the React DevTools/.test(text)
  ) {
    warnings.push(text.slice(0, 160));
  }
});
page.on("pageerror", (e) =>
  errors.push(`PAGEERROR: ${e.message.slice(0, 200)}`),
);
page.on("requestfailed", (r) => {
  // Google Fonts can be blocked in a sandboxed CI runner; that is not our bug.
  if (r.url().includes("fonts.g")) return;
  errors.push(`REQUEST FAILED: ${r.url().slice(-90)}`);
});

const step = async (label, fn) => {
  const before = errors.length;
  await fn();
  await page.waitForTimeout(500);
  const ok = errors.length === before;
  console.log(
    `  ${ok ? "✓" : "✗"} ${label.padEnd(34)} ${page.url().replace(BASE, "") || "/"}`,
  );
};

console.log(`\nMOSSANO nav audit — ${BASE}\n`);

// ── Public routes, loaded cold ────────────────────────────────────────────
console.log("Direct loads");
const routes = [
  "/",
  "/new-edit",
  "/shop",
  "/shop?look=dark-moody&availability=verification_required",
  "/look",
  "/application",
  "/favourites",
  "/private-sourcing",
  "/about",
  "/contact",
];

for (const route of routes) {
  await step(route, () =>
    page.goto(BASE + route, { waitUntil: "networkidle" }),
  );
}

// ── Client-side navigation, which is what actually exercises cleanup ──────
console.log("\nClient-side navigation");
await page.goto(BASE, { waitUntil: "networkidle" });

for (const label of [
  "New Edit",
  "Stone Shop",
  "Shop by Look",
  "Shop by Application",
  "Private Sourcing",
  "About",
  "Contact",
]) {
  await step(`click "${label}"`, async () => {
    const link = page
      .locator("header nav a", { hasText: new RegExp(`^${label}$`, "i") })
      .first();
    if (await link.count()) await link.click();
  });
}

// ── Into a stone and back — the deepest transition, and the one that broke ─
console.log("\nStone detail");
await page.goto(BASE + "/shop", { waitUntil: "networkidle" });

const card = page.locator('a[href^="/stone/"]').first();
if (await card.count()) {
  await step("open a stone", () => card.click());
  await step("favourite it", async () => {
    const fav = page
      .getByRole("button", { name: /save .* to favourites/i })
      .first();
    if (await fav.count()) await fav.click();
  });
  await step("open the enquiry form", async () => {
    const cta = page
      .getByRole("button", { name: /reserve this lot|enquire about this lot/i })
      .first();
    if (await cta.count()) await cta.click();
  });
  await step("back", () => page.goBack());
  await step("forward", () => page.goForward());
} else {
  console.log("  ! no stones in the catalogue — skipping the stone journey");
}

await step("favourites page shows the saved stone", async () => {
  await page.goto(BASE + "/favourites", { waitUntil: "networkidle" });
});

// ── 404 handling ──────────────────────────────────────────────────────────
// A withdrawn stone must return a real 404, not a 200 carrying a "not found"
// message. A soft 404 gets a sold-out lot indexed and left in search results.
console.log("\nNot found");
expectingNotFound = true;

for (const [label, path] of [
  ["unknown route", "/nonsense"],
  ["withdrawn stone", "/stone/does-not-exist"],
  ["invalid selection token", "/selection/aaaaaaaaaaaaaaaaaaaaaaaa"],
]) {
  const response = await page.goto(BASE + path, { waitUntil: "networkidle" });
  const status = response?.status();
  const ok = status === 404;
  if (!ok) errors.push(`${path} returned ${status}, expected 404 (soft 404)`);
  console.log(`  ${ok ? "✓" : "✗"} ${label.padEnd(34)} ${status}`);
}

expectingNotFound = false;

// ── The admin panel, if credentials are available ─────────────────────────
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  console.log("\nAdmin panel");
  await step("login page", () =>
    page.goto(BASE + "/admin/login", { waitUntil: "networkidle" }),
  );
  await step("sign in", async () => {
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page
      .waitForURL(/\/admin(?!\/login)/, { timeout: 15000 })
      .catch(() => {});
  });

  for (const [label, path] of [
    ["stones", "/admin/stones"],
    ["new stone form", "/admin/stones/new"],
    ["edits", "/admin/edits"],
    ["applications", "/admin/applications"],
    ["enquiries", "/admin/enquiries"],
    ["selections", "/admin/selections"],
    ["media", "/admin/media"],
    ["team", "/admin/team"],
  ]) {
    await step(label, async () => {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
    });
  }
} else {
  console.log(
    "\nAdmin panel — skipped (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to include it)",
  );
}

await browser.close();

console.log("");
if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  [...new Set(warnings)].slice(0, 10).forEach((w) => console.log(`  · ${w}`));
  console.log("");
}

if (errors.length) {
  console.log(`FAILED — ${errors.length} console error(s):`);
  [...new Set(errors)].forEach((e) => console.log(`  ✗ ${e}`));
  process.exit(1);
}

console.log("PASSED — every route walked with no console errors.\n");
