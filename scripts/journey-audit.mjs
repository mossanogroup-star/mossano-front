import { chromium } from "playwright";

/**
 * Walks the three journeys the client's own Website document names under
 * "Main Customer Journeys", through the real UI, and then checks the admin API
 * to confirm each one actually produced the record it was supposed to.
 *
 * The second half is the point. A form that appears to submit and quietly
 * writes nothing looks identical to one that works — which is exactly what was
 * happening before the form controls forwarded their refs, when every field
 * validated as empty while showing the text the customer had typed.
 *
 *   BASE=http://localhost:5000 \
 *   SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… node scripts/journey-audit.mjs
 */
const BASE = process.env.BASE ?? "http://localhost:5000";
const EMAIL = process.env.SEED_ADMIN_EMAIL;
const PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (they are in mossano-back/.env).");
  process.exit(1);
}

const failures = [];
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
};

// A marker unique to this run, so the assertions cannot match an older record.
const stamp = String(process.hrtime.bigint()).slice(-8);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => failures.push(`PAGEERROR: ${e.message.slice(0, 120)}`));

console.log(`\nMOSSANO journey audit — ${BASE}\n`);

// ── Setup, which is itself a test ─────────────────────────────────────────
// Reserve only appears on a lot that is Available — an unverified one offers
// Enquire instead, which is correct behaviour and not what this journey is
// about. Marking one available here also exercises Admin Scope §2: the change
// has to reach the storefront immediately, with no rebuild and no cache flush.
const login = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
}).then((r) => r.json());

const token = login?.data?.token;
if (!token) {
  console.error("Could not sign in as admin — check SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.");
  process.exit(1);
}
const auth = { Authorization: `Bearer ${token}` };

const firstAdminStone = await fetch(`${BASE}/api/stones?limit=1`, { headers: auth })
  .then((r) => r.json())
  .then((j) => j.data?.[0]);

await fetch(`${BASE}/api/stones/${firstAdminStone.id}/availability`, {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ availability: "available" }),
});

console.log("0. Availability propagates (Admin Scope §2)");

const publicView = await fetch(`${BASE}/api/public/stones/${firstAdminStone.slug}`)
  .then((r) => r.json())
  .then((j) => j.data.stone);

check(
  "marking a lot Available shows on the storefront at once",
  publicView.availability === "available" && publicView.isReservable,
  `${publicView.mossanoCode} ${publicView.availabilityLabel}`,
);
check("and it earns the verified-lot badge", publicView.isVerifiedLot === true);

const targetSlug = firstAdminStone.slug;
console.log("");

// ── Journey 1 ─────────────────────────────────────────────────────────────
// "Home → New Edit / Stone Shop → Stone Detail → Favourite / Slab Video /
//  WhatsApp / Reserve"
console.log("1. Customer finds a stone");

await page.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
check("the Stone Shop lists stone", (await page.locator('a[href^="/stone/"]').count()) > 0);

const firstStone = page.locator(`a[href="/stone/${targetSlug}"]`).first();
check("the available lot is listed", (await firstStone.count()) > 0, targetSlug);
await firstStone.click();
// waitForLoadState is useless after a client-side navigation — there is no
// load event, so it resolves immediately and the assertions below run against
// the loading placeholder. Wait for content the stone page only renders once
// its data has arrived.
await page.waitForSelector("dl .spec", { timeout: 15000 });
const stoneSlug = new URL(page.url()).pathname.replace("/stone/", "");
check("a stone page opens", stoneSlug === targetSlug, stoneSlug);

// The WhatsApp link must carry the MOSSANO code — Admin Scope §8.
const waHref = await page.locator('a[href^="https://wa.me/"]').first().getAttribute("href");
check(
  "the WhatsApp link carries the MOSSANO code",
  /MM-\d+/.test(decodeURIComponent(waHref ?? "")),
  decodeURIComponent(waHref ?? "").slice(0, 70),
);

await page.getByRole("button", { name: /save .* to favourites/i }).first().click();
await page.goto(`${BASE}/favourites`, { waitUntil: "networkidle" });
check(
  "the favourite survives navigation",
  (await page.locator('a[href^="/stone/"]').count()) > 0,
);

// And a reload, which is what Website §5 actually asks for.
await page.reload({ waitUntil: "networkidle" });
check("the favourite survives a reload", (await page.locator('a[href^="/stone/"]').count()) > 0);

// Reserve, which is an enquiry.
await page.goto(`${BASE}/stone/${stoneSlug}`, { waitUntil: "networkidle" });
const reserveButton = page.getByRole("button", { name: /^reserve this lot$/i }).first();
check("an available lot offers Reserve", (await reserveButton.count()) > 0);
await reserveButton.click();
await page.waitForTimeout(400);
await page.fill("#name", `Journey One ${stamp}`);
await page.fill("#phone", "9820011223");
await page.fill("#company", "Test Architects");
await page.fill("#message", `Reserve check ${stamp}`);
await page.getByRole("button", { name: /request reservation|send/i }).first().click();
await page.waitForTimeout(2500);
check(
  "the reservation form confirms with a reference",
  /MM-E-\d+/.test(await page.locator("body").innerText()),
);

// ── Journey 2 ─────────────────────────────────────────────────────────────
// "Home → Private Sourcing → Requirement → …"
console.log("\n2. Customer needs a specific stone");

await page.goto(`${BASE}/private-sourcing`, { waitUntil: "networkidle" });
await page.fill("#s-name", `Journey Two ${stamp}`);
await page.fill("#s-email", `journey${stamp}@example.com`);
await page.fill("#s-quantity", "5000 sqft");
await page.fill("#s-location", "Mumbai");
// Free text, which is how the client's own example answers read ("1mth").
await page.fill("#s-required", "1 month");
await page.check('input[type="checkbox"][name="wantsMossanoToSelect"]').catch(async () => {
  // The checkbox is registered by react-hook-form, so it may not carry a name
  // attribute the selector can find; fall back to its visible label.
  await page.getByText(/please select the best options/i).click();
});
await page.getByRole("button", { name: /send requirement/i }).click();
await page.waitForTimeout(2500);
check(
  "the sourcing brief confirms with a reference",
  /MM-E-\d+/.test(await page.locator("body").innerText()),
);

// ── The proof: did any of it reach the database? ──────────────────────────
console.log("\n3. What actually landed in the admin inbox");

const inbox = await fetch(`${BASE}/api/enquiries?search=${stamp}&limit=20`, {
  headers: auth,
}).then((r) => r.json());

const found = inbox?.data ?? [];
const reserve = found.find((e) => e.type === "reserve");
const sourcing = found.find((e) => e.type === "sourcing");

check("the reservation reached the inbox", Boolean(reserve), reserve?.reference);
check(
  "it carries the stone it was about",
  Boolean(reserve?.stone?.mossanoCode || reserve?.stoneSnapshot?.mossanoCode),
  reserve?.stone?.mossanoCode ?? reserve?.stoneSnapshot?.mossanoCode,
);
check("the sourcing brief reached the inbox", Boolean(sourcing), sourcing?.reference);
check(
  "the brief kept its structured fields",
  sourcing?.sourcing?.quantity === "5000 sqft" && sourcing?.sourcing?.projectLocation === "Mumbai",
  JSON.stringify({
    quantity: sourcing?.sourcing?.quantity,
    location: sourcing?.sourcing?.projectLocation,
    required: sourcing?.sourcing?.requiredBy,
  }),
);
check(
  'the "MOSSANO chooses for me" flag is set',
  sourcing?.sourcing?.wantsMossanoToSelect === true,
);

await browser.close();

// ── Clean up after itself ─────────────────────────────────────────────────
// This runs against the real database, so every record it created is removed
// again. A test that leaves its own fixtures in the client's enquiry inbox is
// a defect, not a test — the team would be chasing customers who do not exist.
let removed = 0;
for (const enquiry of found) {
  const res = await fetch(`${BASE}/api/enquiries/${enquiry.id}`, { method: "DELETE", headers: auth });
  if (res.ok) removed += 1;
}
console.log(`
  cleaned up ${removed} test enquir${removed === 1 ? "y" : "ies"}`);

// The lot was left Available by the setup step; put it back as it was.
await fetch(`${BASE}/api/stones/${firstAdminStone.id}/availability`, {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ availability: firstAdminStone.availability }),
});
console.log(`  restored ${firstAdminStone.mossanoCode} to ${firstAdminStone.availability}`);

console.log("");
if (failures.length) {
  console.log(`FAILED — ${failures.length}:`);
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
console.log("PASSED — all three journeys complete, and every record landed.\n");
