import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LANG_COOKIE, LOCALE_INFO, isLocale } from "@/lib/i18n/config";

// Same backend as lotto-seed-app.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.1168lot.com/api/v1";

export const TOKEN_COOKIE = "site_api_token";
const MAX_AGE = Number(process.env.SESSION_MAX_AGE ?? 604800); // 7 days

export class UpstreamError extends Error {
  constructor(public status: number, message: string, public payload?: Record<string, unknown>) {
    super(message);
  }
}

export async function upstream<T = Record<string, unknown>>(
  path: string,
  opts: { method?: "GET" | "POST"; body?: unknown; token?: string; revalidate?: number } = {},
): Promise<T> {
  // Member calls (never the shared/cached public ones) carry the visitor's language so the backend can localise its messages.
  let lang: Record<string, string> = {};
  if (opts.token) {
    const v = (await cookies()).get(LANG_COOKIE)?.value;
    const code = LOCALE_INFO[isLocale(v) ? v : DEFAULT_LOCALE].backend;
    lang = { "X-Language": code, language: code, lang: code, locale: code };
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...lang,
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: AbortSignal.timeout(15000), // a hanging backend must fail fast, not hang every request
    // Public, member-independent data may pass `revalidate` (seconds) to be shared between all visitors.
    // Everything else (member data, money actions) is never cached.
    ...(opts.revalidate && !opts.token && (opts.method ?? "GET") === "GET" ? { next: { revalidate: opts.revalidate } } : { cache: "no-store" as const }),
  });
  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {}
  if (!res.ok || json.success === false) {
    const msg = typeof json.message === "string" ? json.message : `HTTP ${res.status}`;
    throw new UpstreamError(res.ok ? 400 : res.status, msg, json);
  }
  return json as T;
}

export async function getToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
}
export async function setToken(token: string) {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}
export async function clearToken() {
  (await cookies()).delete(TOKEN_COOKIE);
}

/** Cache-Control for shared public responses: browser 30 s, CDN/proxy `seconds`, then serve stale while refreshing. */
export const publicCache = (seconds: number) => ({
  "Cache-Control": `public, max-age=30, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
});
