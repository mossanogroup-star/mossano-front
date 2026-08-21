/**
 * Credentials for the audits that need to sign in, and the two failure modes
 * worth distinguishing when they cannot.
 *
 * The admin login already exists in `mossano-back/.env`, which every audit
 * pointed at in its own error message while refusing to read. Loading it here
 * means `npm run audit` works from a clean shell, and the alternative — pasting
 * a live password onto a command line — leaves it in shell history.
 *
 * Anything already in the environment wins, so CI can supply its own account
 * without touching the file.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const BACKEND_ENV = resolve(dirname(fileURLToPath(import.meta.url)), "../../mossano-back/.env");

function fromBackendEnv(key) {
  try {
    for (const line of readFileSync(BACKEND_ENV, "utf8").split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (match?.[1] === key) return match[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env — the caller reports the missing credential itself.
  }
  return undefined;
}

export const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? fromBackendEnv("SEED_ADMIN_EMAIL");
export const ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? fromBackendEnv("SEED_ADMIN_PASSWORD");

/** Audits that cannot run at all without an admin session call this. */
export function requireAdmin() {
  if (ADMIN_EMAIL && ADMIN_PASSWORD) return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
  console.error(
    `No admin credentials. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, or put them in ${BACKEND_ENV}.`,
  );
  process.exit(1);
}

/**
 * Sign-in is rate limited — deliberately, and the audit suite is the noisiest
 * client this server has. Without this a spent limiter reports as
 * "✗ admin can sign in" and takes every later check down with it, so a working
 * defence reads as a broken application. Exits 2 to keep it distinguishable
 * from a real failure.
 *
 * Takes either a `{ status, body }` pair or a parsed body, since the audits
 * differ on which they have to hand.
 */
export function assertSignedIn(response) {
  const body = response?.body ?? response;
  if (response?.status === 429 || body?.error?.code === "TOO_MANY_REQUESTS") {
    const wait = body?.error?.details?.retryAfterSeconds;
    console.error(
      `\nSign-in is rate limited${wait ? ` for another ${wait}s` : ""}. ` +
        `The audit has been run repeatedly — this is the limiter working, not a failure. ` +
        `Wait, then re-run.`,
    );
    process.exit(2);
  }
  const token = body?.data?.token;
  if (!token) {
    console.error("\nCould not sign in as admin — check SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.");
    process.exit(1);
  }
  return token;
}
