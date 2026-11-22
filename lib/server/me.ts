import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;

/** Backend profile -> the member object the site uses (shared by /api/me and the login response). */
export function mapProfile(p: Raw) {
  return {
    success: true as const,
    phone: toStr(p.user_name),
    name: toStr(p.name || p.user_name),
    balance: toNum(p.balance),
    credit: toNum(p.credit),
    diamond: toNum(p.diamond),
    point: toNum(p.point_deposit), // "แต้ม"
    hasBank: toNum(p.bank_code) > 0,
  };
}
