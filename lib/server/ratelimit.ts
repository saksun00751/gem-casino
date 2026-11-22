// Tiny in-memory failure limiter (per server instance). Good enough to slow down password guessing;
// behind several instances/serverless, share the counters (Redis etc.) or rate-limit at the proxy/CDN as well.
type Entry = { count: number; first: number };
const hits = new Map<string, Entry>();

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_FAILS = 5; // per account
const MAX_FAILS_IP = 20; // per IP (higher: many players can share one address)
const limitFor = (k: string) => (k.startsWith("ip:") ? MAX_FAILS_IP : MAX_FAILS);
const MAX_KEYS = 5000; // memory cap

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

function fresh(k: string): Entry | undefined {
  const e = hits.get(k);
  if (!e) return undefined;
  if (Date.now() - e.first > WINDOW_MS) { hits.delete(k); return undefined; }
  return e;
}

/** Seconds to wait if any key is locked, else 0. */
export function lockedFor(keys: string[]): number {
  let wait = 0;
  for (const k of keys) {
    const e = fresh(k);
    if (e && e.count >= limitFor(k)) wait = Math.max(wait, Math.ceil((e.first + WINDOW_MS - Date.now()) / 1000));
  }
  return wait;
}

export function recordFailure(keys: string[]) {
  if (hits.size > MAX_KEYS) { // drop expired entries, then oldest if still too big
    for (const [k, e] of hits) if (Date.now() - e.first > WINDOW_MS) hits.delete(k);
    if (hits.size > MAX_KEYS) hits.clear();
  }
  for (const k of keys) {
    const e = fresh(k);
    if (e) e.count++; else hits.set(k, { count: 1, first: Date.now() });
  }
}

export function clearFailures(keys: string[]) {
  for (const k of keys) hits.delete(k);
}
