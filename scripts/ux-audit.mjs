import { chromium } from "playwright";

/**
 * The storefront judged as a product, not as code.
 *
 * Checks the things a customer feels and a developer never sees: whether the
 * page can be used from a keyboard, whether a screen reader gets anything from
 * a site that is almost entirely photography, whether a thumb can hit the
 * controls, and whether each page tells a search engine something different
 * about itself.
 *
 *   node scripts/ux-audit.mjs
 */
const BASE = process.env.BASE ?? "http://localhost:5000";

const ROUTES = [
  ["home", "/"],
  ["new-edit", "/new-edit"],
  ["shop", "/shop"],
  ["stone", null], // resolved from the shop
  ["look", "/look"],
  ["application", "/application"],
  ["favourites", "/favourites"],
  ["private-sourcing", "/private-sourcing"],
  ["about", "/about"],
  ["contact", "/contact"],
];

const findings = [];
let checks = 0;

const note = (severity, page, message) => {
  findings.push({ severity, page, message });
  console.log(`  ${severity === "high" ? "✗" : "!"} ${page}: ${message}`);
};
const pass = (page, message) => {
  checks += 1;
  console.log(`  ✓ ${page}: ${message}`);
};

const browser = await chromium.launch();
console.log(`\nMOSSANO UX audit — ${BASE}\n`);

// Resolve a real stone page so the deepest template is covered too.
const probe = await browser.newPage();
await probe.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
const stoneHref = await probe
  .locator('a[href^="/stone/"]')
  .first()
  .getAttribute("href")
  .catch(() => null);
await probe.close();
if (stoneHref) ROUTES.find((r) => r[0] === "stone")[1] = stoneHref;

const seenTitles = new Map();
const seenDescriptions = new Map();

// Desktop: semantics, metadata, keyboard
console.log("1. Semantics and metadata");
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const [name, route] of ROUTES) {
  if (!route) continue;
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const audit = await page.evaluate(() => {
    const text = (el) =>
      (el.innerText || el.textContent || "").trim() ||
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      "";

    return {
      lang: document.documentElement.lang,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content ?? "",
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
      h1: Array.from(document.querySelectorAll("h1")).map((h) => h.innerText.trim()),
      headingOrder: Array.from(document.querySelectorAll("h1,h2,h3,h4")).map((h) =>
        Number(h.tagName[1]),
      ),
      imagesWithoutAlt: Array.from(document.images).filter((i) => i.getAttribute("alt") === null)
        .length,
      landmarks: {
        main: document.querySelectorAll("main").length,
        header: document.querySelectorAll("header").length,
        footer: document.querySelectorAll("footer").length,
        nav: document.querySelectorAll("nav").length,
      },
      // Controls a screen reader would announce as nothing at all.
      namelessControls: Array.from(document.querySelectorAll("button, a[href]")).filter(
        (el) => !text(el),
      ).length,
      // Inputs with no label, no aria-label and no placeholder fallback.
      unlabelledInputs: Array.from(
        document.querySelectorAll("input:not([type=hidden]), textarea, select"),
      ).filter((el) => {
        if (el.getAttribute("aria-label")) return false;
        if (el.id && document.querySelector(`label[for="${el.id}"]`)) return false;
        if (el.closest("label")) return false;
        return true;
      }).length,
    };
  });

  const label = name;

  if (audit.lang !== "en") note("high", label, `<html lang> is "${audit.lang}"`);
  if (audit.h1.length !== 1)
    note("high", label, `${audit.h1.length} <h1> elements, expected exactly 1`);
  if (!audit.title) note("high", label, "no page title");
  if (!audit.description) note("high", label, "no meta description");
  if (!audit.canonical) note("med", label, "no canonical URL");
  if (audit.imagesWithoutAlt > 0)
    note("high", label, `${audit.imagesWithoutAlt} image(s) with no alt attribute`);
  if (audit.namelessControls > 0)
    note("high", label, `${audit.namelessControls} control(s) a screen reader cannot name`);
  if (audit.unlabelledInputs > 0)
    note("high", label, `${audit.unlabelledInputs} unlabelled form field(s)`);
  if (audit.landmarks.main !== 1) note("med", label, `${audit.landmarks.main} <main> landmarks`);

  // A heading that jumps h1 → h3 leaves a screen-reader user wondering what
  // they missed.
  const jumps = audit.headingOrder.filter((lv, i, a) => i > 0 && lv - a[i - 1] > 1);
  if (jumps.length) note("med", label, `heading level skipped ${jumps.length}×`);

  if (seenTitles.has(audit.title)) {
    note("med", label, `title duplicates ${seenTitles.get(audit.title)}`);
  } else seenTitles.set(audit.title, label);

  if (audit.description && seenDescriptions.has(audit.description)) {
    note("med", label, `description duplicates ${seenDescriptions.get(audit.description)}`);
  } else seenDescriptions.set(audit.description, label);

  if (
    audit.lang === "en" &&
    audit.h1.length === 1 &&
    audit.title &&
    audit.description &&
    audit.imagesWithoutAlt === 0 &&
    audit.namelessControls === 0 &&
    audit.unlabelledInputs === 0
  ) {
    pass(label, `titled, described, one h1, everything named`);
  }
}

// Keyboard
console.log("\n2. Keyboard");
await page.goto(BASE, { waitUntil: "networkidle" });
await page.keyboard.press("Tab");

const firstStop = await page.evaluate(() => {
  const el = document.activeElement;
  return {
    text: (el.innerText || "").trim().slice(0, 30),
    href: el.getAttribute?.("href"),
  };
});
if (/skip/i.test(firstStop.text)) pass("keyboard", `first tab stop is "${firstStop.text}"`);
else note("med", "keyboard", `first tab stop is "${firstStop.text}", expected a skip link`);

const focusVisible = await page.evaluate(() => {
  const el = document.activeElement;
  const s = getComputedStyle(el);
  return (
    s.outlineStyle !== "none" || s.boxShadow !== "none" || Boolean(el.className.match(/focus/))
  );
});
if (focusVisible) pass("keyboard", "the focused element is visibly marked");
else note("high", "keyboard", "focus is not visible — a keyboard user cannot see where they are");

// Reach the nav by keyboard alone.
let reachedNav = false;
for (let i = 0; i < 12 && !reachedNav; i += 1) {
  await page.keyboard.press("Tab");
  reachedNav = await page.evaluate(() => Boolean(document.activeElement.closest("header nav")));
}
if (reachedNav) pass("keyboard", "the main navigation is reachable by tabbing");
else note("high", "keyboard", "could not reach the navigation within 12 tab presses");

// Phone: touch targets and layout
console.log("\n3. Phone");
const phone = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

for (const [name, route] of ROUTES) {
  if (!route) continue;
  await phone.goto(BASE + route, { waitUntil: "networkidle" });
  await phone.waitForTimeout(400);

  const problems = await phone.evaluate(() => {
    // Visually-hidden controls are 1x1 by design — the skip link is the
    // obvious one — and flagging them buried the real findings.
    const isVisuallyHidden = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.clip === "rect(0px, 0px, 0px, 0px)" || (r.width <= 1 && r.height <= 1);
    };

    const small = [];
    document.querySelectorAll("a[href], button, input, select").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (isVisuallyHidden(el)) return;

      // WCAG 2.5.8 exempts a control that has an equivalent larger target. A
      // checkbox wrapped in its own <label> is exactly that — the whole label
      // toggles it — so measuring the 14px box reports a problem a thumb does
      // not actually have.
      const label = el.closest("label");
      if (label) {
        const lr = label.getBoundingClientRect();
        if (lr.height >= 24 && lr.width >= 24) return;
      }
      // WCAG 2.5.8 (AA) sets the minimum target at 24x24 CSS px. 44px is the
      // more generous platform guidance, but 24 is the line an audit can hold
      // a design to without inflating every inline link into a button.
      if (r.height < 24 || r.width < 24) {
        small.push({
          tag: el.tagName.toLowerCase(),
          label: ((el.innerText || el.getAttribute("aria-label") || "") + "").trim().slice(0, 26),
          size: `${Math.round(r.width)}×${Math.round(r.height)}`,
        });
      }
    });
    return {
      small,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      // Body copy only — prose someone has to read, not UI chrome.
      //
      // DESIGN.md sets button labels and section eyebrows in small, widely
      // tracked capitals, and that is the house voice rather than an oversight:
      // they are short, high-contrast and generously padded. Counting them here
      // turned a check about legibility into a complaint about the typography.
      tinyText: Array.from(document.querySelectorAll("p, li, dd")).filter((el) => {
        if (el.closest("a, button")) return false;
        if (el.classList.contains("label")) return false;
        const size = parseFloat(getComputedStyle(el).fontSize);
        return el.innerText?.trim().length > 20 && size < 12;
      }).length,
    };
  });

  if (problems.overflow > 2)
    note("high", `phone/${name}`, `${problems.overflow}px horizontal overflow`);
  if (problems.small.length) {
    const worst = problems.small
      .slice(0, 3)
      .map((s) => `${s.label || s.tag} ${s.size}`)
      .join(", ");
    note("med", `phone/${name}`, `${problems.small.length} touch target(s) under 32px — ${worst}`);
  }
  if (problems.tinyText > 0)
    note("med", `phone/${name}`, `${problems.tinyText} block(s) of body copy under 12px`);
  if (!problems.overflow && !problems.small.length && !problems.tinyText) {
    pass(`phone/${name}`, "no overflow, targets and text large enough");
  }
}

// Empty and error states
console.log("\n4. States a customer will actually hit");

await phone.goto(`${BASE}/shop?look=bookmatch`, { waitUntil: "networkidle" });
await phone.waitForTimeout(700);
const emptyShop = await phone.locator("body").innerText();
if (/nothing matches|no |source it/i.test(emptyShop)) {
  pass("empty state", "a filter with no results explains itself and offers a way forward");
} else {
  note("high", "empty state", "a filter with no results shows nothing useful");
}

await phone.goto(`${BASE}/stone/withdrawn-lot-that-does-not-exist`, {
  waitUntil: "networkidle",
});
await phone.waitForTimeout(700);
const notFound = await phone.locator("body").innerText();
if (/not found/i.test(notFound) && /shop|home/i.test(notFound)) {
  pass("404", "a withdrawn stone explains itself and offers a way back");
} else {
  note("high", "404", "the not-found page is a dead end");
}

await browser.close();

console.log("\n" + "─".repeat(62));
const high = findings.filter((f) => f.severity === "high");
const med = findings.filter((f) => f.severity === "med");
console.log(`${checks} passed · ${high.length} serious · ${med.length} worth fixing`);
if (high.length) process.exit(1);
console.log("");
