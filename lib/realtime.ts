// Realtime (websocket) for the signed-in member: balance / points / diamonds and wallet notifications.
// Same backend channels as lotto-seed-app (Laravel Echo + Pusher protocol). The library is loaded only when
// a member is signed in, and the member token never reaches the browser (auth goes through /api/realtime/auth/).

export type Wallet = { balance?: number; credit?: number; diamond?: number; point?: number };
export type Activity = { event: string; method: string; message: string; amount: number; data: Record<string, unknown> };
export type LiveState = "connecting" | "live" | "offline";

const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/** Pulls balance / credit / diamond / point out of a (possibly nested) event payload. */
export function extractWallet(payload: unknown): Wallet {
  const out: Wallet = {};
  const queue: Record<string, unknown>[] = payload && typeof payload === "object" ? [payload as Record<string, unknown>] : [];
  const seen = new Set<object>();
  while (queue.length) {
    const cur = queue.shift()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    out.balance ??= num(cur.balance ?? cur.amount_balance);
    out.credit ??= num(cur.credit);
    out.diamond ??= num(cur.diamond);
    out.point ??= num(cur.point_deposit ?? cur.point);
    for (const v of Object.values(cur)) if (v && typeof v === "object" && !Array.isArray(v)) queue.push(v as Record<string, unknown>);
  }
  return out;
}

// Debug log: in development always, in production only if localStorage "debug-realtime" = "1".
// Entries go to the console and to window.__realtimeLog (last 100) so they can be inspected/copied.
function dbg(kind: string, data?: unknown) {
  try {
    if (process.env.NODE_ENV === "production" && localStorage.getItem("debug-realtime") !== "1") return;
    const w = window as unknown as { __realtimeLog?: { t: string; kind: string; data?: unknown }[] };
    (w.__realtimeLog ??= []).push({ t: new Date().toISOString(), kind, data });
    if (w.__realtimeLog.length > 100) w.__realtimeLog.shift();
    console.log("[realtime]", kind, data ?? "");
  } catch { /* logging must never break the app */ }
}

type Handlers = {
  onWallet: (w: Wallet) => void; // values straight from the event
  onActivity: (a: Activity) => void; // wallet notifications (deposit approved ...)
  onState: (s: LiveState) => void;
  onReconcile: () => void; // ask for a fresh profile (after events / reconnect)
};

const unwrap = (j: unknown): Record<string, unknown> => {
  const o = (j && typeof j === "object" ? j : {}) as Record<string, unknown>;
  const inner = o.realtime ?? o.data;
  return (inner && typeof inner === "object" ? inner : o) as Record<string, unknown>;
};

/** Connects and returns a stop() function. Throws if realtime is not available (caller falls back to polling). */
export async function startRealtime(h: Handlers): Promise<() => void> {
  const [cfgRes, ctxRes] = await Promise.all([
    fetch("/api/realtime/config/", { cache: "no-store" }),
    fetch("/api/realtime/context/", { cache: "no-store" }),
  ]);
  if (!cfgRes.ok || !ctxRes.ok) throw new Error("realtime unavailable");
  const cfg = unwrap(await cfgRes.json());
  const ctx = unwrap(await ctxRes.json());

  const key = typeof cfg.key === "string" ? cfg.key : "";
  const memberCode = ctx.member_code != null ? String(ctx.member_code) : "";
  const template = typeof cfg.private_channel_member_template === "string" ? cfg.private_channel_member_template : "";
  const channel =
    (typeof ctx.private_channel === "string" && ctx.private_channel) || (template && memberCode ? template.replace("{member_code}", memberCode) : "");
  if (!key || !channel) throw new Error("realtime not configured");

  const [{ default: Echo }, { default: Pusher }] = await Promise.all([import("laravel-echo"), import("pusher-js")]);
  const port = num(cfg.ws_port) ?? 443;
  const echo = new Echo({
    broadcaster: "pusher",
    Pusher,
    key,
    cluster: typeof cfg.cluster === "string" && cfg.cluster ? cfg.cluster : "mt1",
    wsHost: typeof cfg.ws_host === "string" ? cfg.ws_host : undefined,
    wsPort: port,
    wssPort: port,
    wsPath: typeof cfg.ws_path === "string" ? cfg.ws_path : "",
    forceTLS: cfg.force_tls !== false,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "/api/realtime/auth/", // same origin: the httpOnly cookie authenticates us
    auth: { headers: { Accept: "application/json" } },
  });

  // connection state -> live / offline (and refresh once after every (re)connect: events may have been missed)
  const conn = (echo.connector as unknown as { pusher: { connection: { state: string; bind: (e: string, f: (x: { current: string }) => void) => void } } }).pusher.connection;
  const map = (s: string): LiveState => (s === "connected" ? "live" : s === "connecting" || s === "initialized" ? "connecting" : "offline");
  dbg("connect", { state: conn.state, channel });
  h.onState(map(conn.state));
  conn.bind("state_change", ({ current }) => {
    dbg("state", current);
    h.onState(map(current));
    if (current === "connected") h.onReconcile();
  });

  echo
    .private(channel)
    .listen(".member.balance.updated", (payload: unknown) => {
      dbg("member.balance.updated", payload);
      dbg("  -> wallet patch", extractWallet(payload));
      h.onWallet(extractWallet(payload));
      h.onReconcile();
    })
    .listen(".member.activity.updated", (payload: Record<string, unknown>) => {
      dbg("member.activity.updated", payload);
      const data = (payload?.data && typeof payload.data === "object" ? payload.data : {}) as Record<string, unknown>;
      h.onActivity({
        event: typeof payload?.event === "string" ? payload.event : "",
        method: typeof payload?.method === "string" ? payload.method : "",
        message: typeof payload?.message === "string" ? payload.message : "",
        amount: num(data.amount) ?? 0,
        data,
      });
      h.onWallet(extractWallet(payload));
      if (["deposit", "withdraw", "rollback", "adjust"].includes(String(payload?.method))) h.onReconcile();
    })
    .error((err: unknown) => { dbg("channel error", err); h.onState("offline"); });

  return () => {
    try { echo.leave(channel); echo.disconnect(); } catch { /* already closed */ }
  };
}
