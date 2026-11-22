import { API_BASE } from "@/lib/server/upstream";

export type SiteMeta = {
  name: string;
  title: string;
  description: string;
  logo: string;
  depositMin: number;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * Site-wide info from the backend ( GET /meta/site, public ), cached for 5 minutes.
 * Returns null when the backend is unreachable so callers fall back to the built-in brand.
 * `header_code` (a raw snippet the back office can inject into every page) is deliberately NOT used:
 * running arbitrary backend-supplied code on every page is a risk this site does not need.
 */
export async function getSiteMeta(): Promise<SiteMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/meta/site`, { headers: { "Content-Type": "application/json" }, next: { revalidate: 300 } });
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, unknown>;
    const d = (j.data && typeof j.data === "object" ? (j.data as Record<string, unknown>) : j) as Record<string, unknown>;
    const name = str(d.name);
    if (!name) return null;
    const logo = str(d.logo);
    const depositMin = Number(d.deposit_min);
    return {
      name,
      title: str(d.title) || name,
      description: str(d.description),
      // only real web images may be used as the logo / favicon
      logo: /^https?:\/\//i.test(logo) ? logo : "",
      depositMin: Number.isFinite(depositMin) && depositMin > 0 ? depositMin : 0,
    };
  } catch {
    return null;
  }
}
