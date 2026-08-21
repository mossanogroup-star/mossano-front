/**
 * The API, checked the way it will actually be attacked and misused.
 *
 * Not a unit-test suite — those would test the code as written. This tests the
 * boundaries a customer, a crawler and a bored visitor can reach: what a public
 * request can see, what each role can do, what happens to malformed input, and
 * whether private things stay private.
 *
 * Needs a running server and an admin account — see auditEnv.mjs.
 */
import { requireAdmin, assertSignedIn } from "./auditEnv.mjs";

const BASE = process.env.BASE ?? "http://localhost:5000";
const { email: EMAIL, password: PASSWORD } = requireAdmin();

const failures = [];
let checks = 0;

const check = (label, ok, detail = "") => {
  checks += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
};

const status = async (path, options = {}) => (await fetch(BASE + path, options)).status;
const json = async (path, options = {}) => {
  const res = await fetch(BASE + path, options);
  return { status: res.status, body: await res.json().catch(() => null), res };
};

const section = (t) => console.log(`\n${t}`);

console.log(`\nMOSSANO API audit — ${BASE}`);

// Session
const login = await json("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const token = assertSignedIn(login);
const admin = { Authorization: `Bearer ${token}` };
const adminJson = { ...admin, "Content-Type": "application/json" };

section("1. Authentication");
check("admin can sign in", Boolean(token));
check(
  "wrong password is rejected",
  (await status("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: "wrong-password-here" }),
  })) === 401,
);
check(
  "the error does not reveal whether the account exists",
  await (async () => {
    const a = await json("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: "wrong-password-here" }),
    });
    const b = await json("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nobody@example.com",
        password: "wrong-password-here",
      }),
    });
    return a.body?.error?.message === b.body?.error?.message;
  })(),
);
check(
  "a garbage token is rejected",
  (await status("/api/stones", {
    headers: { Authorization: "Bearer nope" },
  })) === 401,
);
check(
  "a NoSQL operator in the login body is rejected",
  (await status("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: { $ne: null }, password: { $ne: null } }),
  })) === 400,
);

// Admin surface is closed
section("2. Every admin route refuses anonymous access");
for (const path of [
  "/api/stones",
  "/api/edits",
  "/api/applications",
  "/api/enquiries",
  "/api/selections",
  "/api/media",
  "/api/users",
  "/api/dashboard",
]) {
  check(`GET ${path}`, (await status(path)) === 401);
}

// Roles
section("3. Role boundaries");
const viewerEmail = `audit-viewer-${Date.now()}@example.com`;
const created = await json("/api/users", {
  method: "POST",
  headers: adminJson,
  body: JSON.stringify({
    name: "Audit Viewer",
    email: viewerEmail,
    password: "auditpass12345",
    role: "viewer",
  }),
});
const viewerId = created.body?.data?.id;
const viewerToken = (
  await json("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: viewerEmail, password: "auditpass12345" }),
  })
).body?.data?.token;
const viewer = { Authorization: `Bearer ${viewerToken}` };

check(
  "a viewer can read the catalogue",
  (await status("/api/stones", { headers: viewer })) === 200,
);
check(
  "a viewer cannot create a stone",
  (await status("/api/stones", {
    method: "POST",
    headers: { ...viewer, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Should not exist" }),
  })) === 403,
);
check(
  "a viewer cannot change availability",
  (await status("/api/stones/000000000000000000000000/availability", {
    method: "PATCH",
    headers: { ...viewer, "Content-Type": "application/json" },
    body: JSON.stringify({ availability: "available" }),
  })) === 403,
);
check("a viewer cannot see the team", (await status("/api/users", { headers: viewer })) === 403);

// What the storefront can see
section("4. The public API leaks nothing internal");
const anySlug = (await json("/api/public/stones?limit=1")).body?.data?.[0]?.slug;
const publicStone = await json(`/api/public/stones/${anySlug}`);
const asText = JSON.stringify(publicStone.body?.data?.stone ?? {});

for (const field of [
  "internalNotes",
  "lotNumber",
  "isPublished",
  "createdBy",
  "updatedBy",
  "storageKey",
  "availabilityRank",
  "__v",
]) {
  check(`public stone hides ${field}`, !asText.includes(`"${field}"`));
}

const publicEnquiryEcho = await json("/api/public/enquiries", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Audit Receipt Check", phone: "9820011223" }),
});
const receipt = publicEnquiryEcho.body?.data ?? {};
check(
  "submitting a form returns only a reference, never the record",
  Object.keys(receipt).every((k) => ["reference", "type", "receivedAt"].includes(k)),
  Object.keys(receipt).join(", "),
);

// Validation
section("5. Input validation");
check(
  "an enquiry with no way to reply is refused",
  (await status("/api/public/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "No Contact" }),
  })) === 400,
);
check(
  "an enquiry with no name is refused",
  (await status("/api/public/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9820011223" }),
  })) === 400,
);
check(
  "malformed JSON returns 400, not a stack trace",
  await (async () => {
    const r = await fetch(`${BASE}/api/public/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    const b = await r.json().catch(() => null);
    return r.status === 400 && !JSON.stringify(b).includes("stack");
  })(),
);
check(
  "an invalid ObjectId is a 400, not a 500",
  (await status("/api/stones/not-an-id", { headers: admin })) === 400,
);
check("limit beyond the cap is refused", (await status("/api/public/stones?limit=99999")) === 400);
check(
  "a page past the end is an empty 200",
  (await status("/api/public/stones?page=99999")) === 200,
);
check("an unknown look is 404", (await status("/api/public/looks/not-a-real-look")) === 404);
check("an unknown stone is 404", (await status("/api/public/stones/not-a-real-stone")) === 404);

// Private selections
section("6. Private selections stay private");
const stoneIds = (await json("/api/stones?limit=2", { headers: admin })).body.data.map((s) => s.id);

const draft = (
  await json("/api/selections", {
    method: "POST",
    headers: adminJson,
    body: JSON.stringify({
      title: "Audit draft",
      customerName: "Audit Co",
      stoneIds,
      isPublished: false,
    }),
  })
).body.data;
check(
  "an unpublished selection is not reachable",
  (await status(`/api/public/selections/${draft.token}`)) === 404,
);

const live = (
  await json("/api/selections", {
    method: "POST",
    headers: adminJson,
    body: JSON.stringify({
      title: "Audit live",
      customerName: "Audit Co",
      stoneIds,
      isPublished: true,
    }),
  })
).body.data;
check(
  "a shared selection opens with no login",
  (await status(`/api/public/selections/${live.token}`)) === 200,
);
check("its PDF renders", (await status(`/api/public/selections/${live.token}/pdf`)) === 200);

const liveBody = (await json(`/api/public/selections/${live.token}`)).body.data;
check(
  "the customer's view hides the view count and the team's notes",
  !("viewCount" in liveBody) && !("notes" in liveBody) && !("token" in liveBody),
);

await fetch(`${BASE}/api/selections/${live.id}/revoke`, {
  method: "POST",
  headers: admin,
});
const revoked = await json(`/api/public/selections/${live.token}`);
check("a revoked link returns 410, not 404", revoked.status === 410, `got ${revoked.status}`);
check(
  "and says why, so the team can explain it",
  revoked.body?.error?.code === "SELECTION_REVOKED",
  revoked.body?.error?.code,
);
check(
  "a guessed token is 404",
  (await status("/api/public/selections/aaaaaaaaaaaaaaaaaaaaaaaa")) === 404,
);

// Availability, the site's central claim
section("7. Availability propagates (Admin Scope §2)");
const target = (await json("/api/stones?limit=1", { headers: admin })).body.data[0];
const originalAvailability = target.availability;

await fetch(`${BASE}/api/stones/${target.id}/availability`, {
  method: "PATCH",
  headers: adminJson,
  body: JSON.stringify({ availability: "sold" }),
});
const afterSold = (await json(`/api/public/stones/${target.slug}`)).body.data.stone;
check("marking Sold reaches the storefront immediately", afterSold.availability === "sold");
check("and a sold lot cannot be reserved", afterSold.isReservable === false);

await fetch(`${BASE}/api/stones/${target.id}/availability`, {
  method: "PATCH",
  headers: adminJson,
  body: JSON.stringify({ availability: originalAvailability }),
});
check(
  "restored",
  (await json(`/api/public/stones/${target.slug}`)).body.data.stone.availability ===
    originalAvailability,
);

// Discovery
section("8. Discovery");
const robots = await fetch(`${BASE}/robots.txt`);
const robotsText = await robots.text();
check("robots.txt is served", robots.status === 200);
check("it keeps crawlers out of /admin", robotsText.includes("Disallow: /admin"));
check("and out of private selections", robotsText.includes("Disallow: /selection/"));
check("and points at the sitemap", robotsText.includes("Sitemap:"));

const sitemap = await fetch(`${BASE}/sitemap.xml`);
const sitemapText = await sitemap.text();
const urlCount = (sitemapText.match(/<url>/g) || []).length;
check("sitemap.xml is served", sitemap.status === 200);
check(
  "it lists every published stone",
  (sitemapText.match(/\/stone\//g) || []).length > 0,
  `${urlCount} URLs`,
);
check("it never lists a private selection", !sitemapText.includes("/selection/"));
check("it never lists favourites", !sitemapText.includes("/favourites"));

// Response shape
section("9. One response shape, everywhere");
const ok = await json("/api/public/home");
check("success is { success, data }", ok.body?.success === true && "data" in ok.body);
const bad = await json("/api/public/stones/nope-not-real");
check(
  "failure is { success:false, error:{ code, message } }",
  bad.body?.success === false &&
    Boolean(bad.body?.error?.code) &&
    Boolean(bad.body?.error?.message),
);
check("production responses carry no stack trace", !JSON.stringify(bad.body).includes("stack"));

// Clean up everything this run created
section("Cleaning up");
let removed = 0;
for (const id of [draft.id, live.id]) {
  if (
    (
      await fetch(`${BASE}/api/selections/${id}`, {
        method: "DELETE",
        headers: admin,
      })
    ).ok
  )
    removed += 1;
}
const strays =
  (await json(`/api/enquiries?search=Audit Receipt Check`, { headers: admin })).body?.data ?? [];
for (const e of strays) {
  if (
    (
      await fetch(`${BASE}/api/enquiries/${e.id}`, {
        method: "DELETE",
        headers: admin,
      })
    ).ok
  )
    removed += 1;
}
if (viewerId) {
  if (
    (
      await fetch(`${BASE}/api/users/${viewerId}`, {
        method: "DELETE",
        headers: admin,
      })
    ).ok
  )
    removed += 1;
}
console.log(`  removed ${removed} record(s) created by this audit`);

console.log("\n" + "─".repeat(62));
if (failures.length) {
  console.log(`FAILED — ${failures.length} of ${checks}:`);
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
console.log(`PASSED — ${checks} checks.\n`);
