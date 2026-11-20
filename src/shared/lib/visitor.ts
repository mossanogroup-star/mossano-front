import { api } from "@/shared/api/http";

/**
 * Remembers, in this browser, whether the visitor has already given MOSSANO
 * their email and phone number — so the image-view popup is asked once and
 * never again on a later visit.
 *
 * Client request (20 Nov 2026) — asked once per person, not per browser. The
 * server also remembers the network the details came from (any device or
 * private window on the same Wi-Fi is let through) and recognises the email or
 * phone itself, for the "Already shared your details?" link in the popup.
 *
 * localStorage only: it can be missing or throw (private windows, blocked site
 * data, the server render), and every read and write is guarded so the worst
 * case is the popup asking a second time, never a broken page.
 */
const KNOWN_KEY = "mossano:visitor";
/** A new key, so counts kept by the earlier click-counting version are not reused. */
const VIEWED_KEY = "mossano:images-viewed";

function read(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — nothing to remember with */
  }
}

export function isVisitorKnown(): boolean {
  return read(KNOWN_KEY) !== null;
}

export function markVisitorKnown(details: { email?: string; phone?: string }) {
  write(KNOWN_KEY, JSON.stringify({ ...details, at: new Date().toISOString() }));
}

let serverCheck: Promise<boolean> | null = null;

/**
 * Asks the server whether someone on this network already shared their
 * details, once per page load. Any failure counts as "not known" — the popup
 * then behaves exactly as it did before.
 */
export function checkVisitorKnownOnServer(): Promise<boolean> {
  if (isVisitorKnown()) return Promise.resolve(true);
  serverCheck ??= api
    .get<{ known: boolean }>("/public/visitor")
    .then((res) => {
      if (res.data?.known) markVisitorKnown({});
      return Boolean(res.data?.known);
    })
    .catch(() => false);
  return serverCheck;
}

/**
 * "Already shared your details?" — true when the server holds this email or
 * phone, in which case this browser is remembered too.
 */
export async function recogniseVisitor(contact: string): Promise<boolean> {
  const res = await api.post<{ known: boolean }>("/public/visitor/recognise", { contact });
  if (res.data?.known) markVisitorKnown({});
  return Boolean(res.data?.known);
}

/** This page view's images, for when storage is unavailable. */
const memoryViewed = new Set<string>();

function storedViewed(): string[] {
  try {
    const parsed = JSON.parse(read(VIEWED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** How many different images this visitor has opened so far. */
export function viewedImageCount(): number {
  return new Set([...storedViewed(), ...memoryViewed]).size;
}

/** Records one image as opened; the same image opened again is not counted twice. */
export function recordImageView(key: string) {
  memoryViewed.add(key);
  const all = new Set([...storedViewed(), ...memoryViewed]);
  write(VIEWED_KEY, JSON.stringify([...all].slice(-20)));
}
