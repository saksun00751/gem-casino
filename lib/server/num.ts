export const toNum = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};
export const toStr = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
