import { chromium } from "playwright";
import { requireAdmin, assertSignedIn } from "./auditEnv.mjs";

/**
 * Drives the chatbot through the client's own script — Interested? → Quantity?
 * → Location? → Delivery? — using their own example answers, so this tests the
 * documented case rather than a convenient one. Then checks the lead reached
 * the inbox intact. Cleans up after itself.
 */
const BASE = process.env.BASE ?? "http://localhost:5000";
const { email: EMAIL, password: PASSWORD } = requireAdmin();

const failures = [];
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
};

const stamp = String(process.hrtime.bigint()).slice(-8);
const NAME = `Chatbot Test ${stamp}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => failures.push(`PAGEERROR: ${e.message.slice(0, 140)}`));

console.log(`\nMOSSANO chatbot audit — ${BASE}\n`);

// The happy path, with the client's own answers
console.log("1. The documented flow");

await page.goto(BASE, { waitUntil: "networkidle" });

const launcher = page.getByRole("button", { name: /sourcing desk/i });
check("the launcher is on the page", (await launcher.count()) > 0);

await launcher.click();
await page.waitForTimeout(400);
check(
  "it opens and asks the first question",
  await page.getByText(/sourcing stone for a project/i).isVisible(),
);

await page.getByRole("button", { name: "Yes, I am" }).click();
await page.waitForTimeout(300);
check("Interested? → asks Quantity", await page.getByText(/how much do you need/i).isVisible());

await page.fill("#mossano-chat input", "5000 sqft");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
check("Quantity? → asks Location", await page.getByText(/where is the project/i).isVisible());

await page.getByRole("button", { name: "Mumbai" }).click();
await page.waitForTimeout(300);
check(
  "Location? → asks Delivery",
  await page.getByText(/when do you need it on site/i).isVisible(),
);

await page.getByRole("button", { name: "1 month" }).click();
await page.waitForTimeout(300);
check(
  "Delivery? → asks for a name",
  await page.getByText(/who should the desk ask for/i).isVisible(),
);

// Validation, which the client's diagram does not cover
console.log("\n2. Validation");

await page.fill("#mossano-chat input", "A");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
check("a one-character name is rejected", await page.getByText(/please give a name/i).isVisible());

await page.fill("#mossano-chat input", NAME);
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
check("a real name is accepted", await page.getByText(/number we can reach you on/i).isVisible());

await page.fill("#mossano-chat input", "12345");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
check("a short phone number is rejected", await page.getByText(/looks short/i).isVisible());

await page.fill("#mossano-chat input", "9820011223");
await page.keyboard.press("Enter");
await page.waitForTimeout(2500);

const body = await page.locator("#mossano-chat").innerText();
check("the lead is confirmed with a reference", /MM-E-\d+/.test(body), body.match(/MM-E-\d+/)?.[0]);
check(
  "and WhatsApp is offered as the next step",
  await page.getByRole("link", { name: /continue on whatsapp/i }).isVisible(),
);

// The other branch
console.log("\n3. 'Just browsing' must not create a lead");

const page2 = await browser.newPage();
await page2.goto(BASE, { waitUntil: "networkidle" });
await page2.getByRole("button", { name: /sourcing desk/i }).click();
await page2.waitForTimeout(400);
await page2.getByRole("button", { name: "Just browsing" }).click();
await page2.waitForTimeout(1500);
const body2 = await page2.locator("#mossano-chat").innerText();
check("it closes politely", /browse the stone shop/i.test(body2));
check("and creates no enquiry", !/MM-E-\d+/.test(body2));

// Did it actually land?
console.log("\n4. What reached the inbox");

const auth = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
  .then((r) => r.json())
  .then((j) => ({ Authorization: `Bearer ${assertSignedIn(j)}` }));

const found = await fetch(`${BASE}/api/enquiries?search=${stamp}&limit=10`, {
  headers: auth,
})
  .then((r) => r.json())
  .then((j) => j.data ?? []);

const lead = found.find((e) => e.type === "chatbot");
check("one chatbot lead exists", found.length === 1 && Boolean(lead), lead?.reference);
check("typed as Chatbot", lead?.typeLabel === "Chatbot");
check("flagged high intent", lead?.isHighIntent === true);
check("quantity kept", lead?.sourcing?.quantity === "5000 sqft", lead?.sourcing?.quantity);
check(
  "location kept",
  lead?.sourcing?.projectLocation === "Mumbai",
  lead?.sourcing?.projectLocation,
);
check("delivery kept", lead?.sourcing?.requiredBy === "1 month", lead?.sourcing?.requiredBy);
check("contact kept", lead?.phone === "9820011223", lead?.phone);
check("status is New", lead?.status === "new");

// Clean up.
let removed = 0;
for (const e of found) {
  const res = await fetch(`${BASE}/api/enquiries/${e.id}`, {
    method: "DELETE",
    headers: auth,
  });
  if (res.ok) removed += 1;
}
console.log(`\n  cleaned up ${removed} test lead${removed === 1 ? "" : "s"}`);

await browser.close();

console.log("");
if (failures.length) {
  console.log(`FAILED — ${failures.length}:`);
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
console.log("PASSED — the client's flow works end to end and the lead landed.\n");
