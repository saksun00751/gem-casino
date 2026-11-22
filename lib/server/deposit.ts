import { API_BASE, upstream } from "@/lib/server/upstream";
import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;
export const rec = (v: unknown): Raw | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : null);

export const PROVIDER_ID = /^[a-zA-Z0-9_-]+$/;
export const MAX_AMOUNT = 10_000_000;

// SSRF guard: server-side requests may only go to the backend's own (registrable) domain.
const registrable = (host: string) => host.split(".").slice(-2).join(".");
export function isBackendUrl(url: string): boolean {
  try {
    const t = new URL(url);
    if (t.protocol !== "https:" && t.protocol !== "http:") return false;
    return registrable(t.hostname) === registrable(new URL(API_BASE).hostname);
  } catch {
    return false;
  }
}

export type Account = {
  code: number;
  accNo: string;
  accName: string;
  bankName: string;
  bankPic: string;
  qrPic: string;
  depositMin: number;
  remark: string;
};
export type Provider = { id: string; name: string; minDeposit: number; remark: string; paymentUrl: string };

export async function loadBank(method: "bank" | "tw" | "slip" | "payment", token: string) {
  return upstream<Raw>("/deposit/loadbank", { method: "POST", token, body: { method } });
}

// The backend returns receiving accounts in three shapes depending on the channel:
//   bank -> array, tw -> object keyed by id ({"1": {...}}), slip -> one account object.
export function accountsFrom(payload: Raw): Account[] {
  const d = rec(payload.data);
  const source = [payload.bank, d?.bank, d?.items, d?.accounts, payload.data].find((v) => Array.isArray(v) || rec(v));
  let entries: [string, unknown][] = [];
  if (Array.isArray(source)) entries = source.map((a, i) => [String(i + 1), a]);
  else if (rec(source)) entries = rec(source)!.acc_no ? [["1", source]] : Object.entries(rec(source)!);
  return entries
    .map(([key, v], i): Account | null => {
      const a = rec(v);
      if (!a || !a.acc_no || !a.acc_name || !a.bank_name) return null;
      const code = typeof a.code === "number" ? a.code : toNum(a.code, toNum(key, i + 1));
      return {
        code,
        accNo: toStr(a.acc_no),
        accName: toStr(a.acc_name),
        bankName: toStr(a.bank_name),
        bankPic: toStr(a.bank_pic),
        qrPic: toStr(a.qr_pic),
        depositMin: toNum(a.deposit_min),
        remark: toStr(a.remark),
      };
    })
    .filter((a): a is Account => a !== null);
}

// Top-level notice from the backend (e.g. "use the wallet to make the deposit").
export const noteFrom = (payload: Raw): string => toStr(payload.message).trim();

export function providersFrom(payload: Raw): Provider[] {
  const bank = rec(payload.bank);
  if (!bank) return [];
  return Object.entries(bank)
    .map(([key, p]): Provider | null => {
      const r = rec(p);
      if (!r?.name) return null;
      const id = toStr(r.id) || key;
      if (!PROVIDER_ID.test(id)) return null;
      return { id, name: toStr(r.name), minDeposit: toNum(r.min_deposit), remark: toStr(r.remark), paymentUrl: toStr(r.payment_url).trim() };
    })
    .filter((p): p is Provider => p !== null);
}

export function pickStatus(payload: unknown): "paid" | "expired" | "pending" {
  const root = rec(payload);
  const data = rec(root?.data);
  const raw = data?.status ?? root?.status ?? data?.payment_status ?? root?.payment_status ?? data?.state ?? root?.state ?? "";
  const words = String(raw).trim().toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (words.includes("paid") || words.includes("success") || words.includes("complete")) return "paid";
  if (words.includes("expired") || words.includes("expire")) return "expired";
  return "pending";
}

export type Qr = { requestId: string; txid: string; amount: number; payAmount: number; image: string; expiredAt: string };

export function qrFrom(payload: unknown, fallbackRequestId = ""): Qr | null {
  const root = rec(payload);
  if (!root) return null;
  const d = rec(root.data) ?? root;
  const qrcode = toStr(d.qrcode).trim();
  if (!qrcode) return null;
  const requestId = (toStr(d.request_id) || toStr(d.requestId) || fallbackRequestId).trim();
  if (!requestId) return null;
  // Only image payloads are accepted (the value ends up in an <img src>).
  const image = qrcode.startsWith("data:image/") ? qrcode : /^[A-Za-z0-9+/=\s]+$/.test(qrcode) ? `data:image/png;base64,${qrcode}` : "";
  if (!image) return null;
  return { requestId, txid: toStr(d.txid), amount: toNum(d.amount), payAmount: toNum(d.payamount), image, expiredAt: toStr(d.expired_date) };
}

export function requestIdFrom(payload: unknown): string | null {
  const r = rec(payload);
  if (!r) return null;
  const d = rec(r.data);
  const direct = (toStr(r.request_id) || toStr(r.requestId) || toStr(d?.request_id) || toStr(d?.requestId)).trim();
  if (direct) return direct;
  const url = (toStr(r.url) || toStr(d?.url)).trim();
  if (!url) return null;
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() || null;
  } catch {
    return null;
  }
}
