/**
 * The API client, shared by the storefront and the admin panel.
 *
 * The same call runs in a browser, where a relative URL is right, and in Node
 * during SSR, where `fetch` has no origin — hence `configureApiBase`.
 *
 * There is deliberately no build-time base URL. mossano-back serves the
 * storefront, so "/api" is same-origin and follows the site to any domain
 * without a rebuild.
 */

/** Empty in the browser, where "/api" is same-origin. SSR overrides it. */
let apiBase = "";

/**
 * Called by entry-server before rendering; never in the browser. Wins over the
 * build-time value — the request's own origin beats anything compiled in.
 */
export function configureApiBase(origin: string) {
  apiBase = origin.replace(/\/+$/, "");
}

const TOKEN_KEY = "mossano.admin.token";

/**
 * The admin token. Guarded twice over: this module is imported during SSR where
 * `window` is undefined, and a browser with site data blocked *throws* rather
 * than returning null.
 */
export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private window, or site data blocked — the session lasts this tab only */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  success: true;
  message?: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ path?: string; field?: string; message: string }>;
  };
}

/**
 * Carries the server's own message and field-level details, so a form can show
 * "Add an email address or a phone number" against the right input rather than
 * a generic failure.
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: ApiErrorBody["error"]["details"];

  constructor(status: number, body: ApiErrorBody["error"]) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }

  /** Field name → message, for react-hook-form's setError. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const d of this.details ?? []) {
      // The server namespaces validation paths as "body.email"; forms do not.
      const key = (d.path ?? d.field ?? "").replace(/^body\./, "");
      if (key) out[key] = d.message;
    }
    return out;
  }
}

type QueryValue = string | number | boolean | null | undefined | Array<string | number>;

/**
 * Arrays join with commas rather than repeating the key: it matches
 * csvQuerySchema on the server and keeps a filtered URL short enough to share.
 */
export function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    if (Array.isArray(value)) {
      if (!value.length) continue;
      search.set(key, value.join(","));
    } else {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Attach the admin bearer token. Public storefront calls leave this off. */
  auth?: boolean;
  signal?: AbortSignal;
  /** FormData for uploads — Content-Type must be left to the browser. */
  formData?: FormData;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {};

  if (options.auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${apiBase}/api${path}`, {
    method: options.method ?? "GET",
    headers,
    // Never set both: a multipart request must not carry a JSON content type.
    body:
      options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    signal: options.signal,
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    // A non-JSON response is a proxy or a crash, not an API error.
    throw new ApiError(res.status, {
      code: "NETWORK",
      message: `The server returned an unreadable response (${res.status}).`,
    });
  }

  if (!res.ok || (payload as ApiErrorBody).success === false) {
    const body = (payload as ApiErrorBody).error ?? {
      code: "UNKNOWN",
      message: "Something went wrong.",
    };
    // An expired admin session should not leave a dead token behind to be
    // retried on every subsequent request.
    if (res.status === 401 && options.auth) tokenStore.clear();
    throw new ApiError(res.status, body);
  }

  return payload as ApiEnvelope<T>;
}

export const api = {
  get: <T>(path: string, params?: Record<string, QueryValue>, opts?: RequestOptions) =>
    request<T>(`${path}${buildQuery(params)}`, opts),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),

  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),

  // Defaults to sending the admin token, but the public reference-image
  // upload passes auth: false — it has no session and needs none.
  upload: <T>(path: string, formData: FormData, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", formData, auth: opts?.auth ?? true }),
};

/** Most callers want the payload, not the envelope. */
export const unwrap = async <T>(p: Promise<ApiEnvelope<T>>): Promise<T> => (await p).data;
