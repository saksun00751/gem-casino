"use client";
import * as React from "react";
import { useSite } from "@/components/providers";
import { ALL_CATEGORIES, getCategory, type Category } from "@/lib/games";

export type Provider = { id: string; name: string; logo: string; type: string };

// Same endpoints lotto-seed-app uses: GET {base}/games/providers/{type} (read-only, no auth).
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.1168lot.com/api/v1";

type ApiProvider = { provider: string; providerName: string; logoURL?: string; status?: string };

const cache = new Map<string, Promise<Provider[]>>();

export function fetchProviders(type: string): Promise<Provider[]> {
  let p = cache.get(type);
  if (!p) {
    p = fetch(`${BASE}/games/providers/${type}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        const data: ApiProvider[] = Array.isArray(j?.data) ? j.data : j?.data?.providers ?? [];
        return data
          .filter((x) => !x.status || x.status === "ACTIVE")
          .map((x) => ({ id: x.provider, name: x.providerName, logo: x.logoURL ?? "", type }));
      });
    p.catch(() => cache.delete(type)); // allow retry after a failure
    cache.set(type, p);
  }
  return p;
}


// ── Open game types ( GET {base}/games/types, public ) ──
// A category shows up when the backend has at least one of its types open (like lotto-seed-app).
let typesPromise: Promise<string[]> | null = null;
function fetchOpenTypes(): Promise<string[]> {
  if (!typesPromise) {
    typesPromise = fetch(`${BASE}/games/types`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((j) => (Array.isArray(j?.data) ? (j.data as { id?: string; status_open?: string }[]) : [])
        .filter((t) => t.status_open === "Y" && t.id)
        .map((t) => String(t.id).toLowerCase()));
    typesPromise.catch(() => { typesPromise = null; });
  }
  return typesPromise;
}

/** Until the list arrives (or if it fails) every category except FISH is shown, so the menu never jumps empty. */
const FALLBACK: Category[] = ALL_CATEGORIES.filter((c) => c.id !== "fish");

export function useCategories(): Category[] {
  const [list, setList] = React.useState<Category[]>(FALLBACK);
  React.useEffect(() => {
    let alive = true;
    fetchOpenTypes()
      .then((open) => {
        if (!alive || open.length === 0) return;
        const cats = ALL_CATEGORIES
          .map((c) => ({ ...c, types: c.types.filter((t) => open.includes(t)) }))
          .filter((c) => c.types.length > 0);
        if (cats.length) setList(cats);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return list;
}

export type ProvidersState = { status: "loading" | "ready" | "error"; list: Provider[] };

export function useProviders(cat: string, retryKey = 0): ProvidersState {
  const [state, setState] = React.useState<ProvidersState>({ status: "loading", list: [] });
  React.useEffect(() => {
    let alive = true;
    const types = getCategory(cat)?.types ?? [];
    setState({ status: "loading", list: [] });
    // One failing type must not hide the others: only an all-types failure is an error.
    Promise.allSettled(types.map(fetchProviders))
      .then((results) => {
        if (!alive) return;
        if (results.length > 0 && results.every((r) => r.status === "rejected")) return setState({ status: "error", list: [] });
        const seen = new Set<string>();
        const list = results
          .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
          .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
        setState({ status: "ready", list });
      });
    return () => { alive = false; };
  }, [cat, retryKey]);
  return state;
}

// ── Slides: our /api/slides route calls the backend ( GET /slides ) and sends the member token when signed in ──
export type SlideImage = { id: string; src: string; alt: string };
export type SlidesState = { status: "loading" | "ready" | "error"; slides: SlideImage[] };

const slidesCache = new Map<string, Promise<SlideImage[]>>();
function fetchSlides(key: string): Promise<SlideImage[]> {
  let p = slidesCache.get(key);
  if (!p) {
    p = fetch("/api/slides/", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((j) => (Array.isArray(j?.slides) ? (j.slides as { id: string; src: string; alt?: string }[]) : [])
        .map((s, i) => ({ id: s.id, src: s.src, alt: s.alt || "" })));
    p.catch(() => slidesCache.delete(key));
    slidesCache.set(key, p);
  }
  return p;
}

/** Slides for the home page. Reloads when the member signs in/out (slides may differ for members). */
export function useSlides(): SlidesState & { retry: () => void } {
  const { user } = useSite();
  const key = user ?? "guest";
  const [state, setState] = React.useState<SlidesState>({ status: "loading", slides: [] });
  const [tries, setTries] = React.useState(0);
  React.useEffect(() => {
    let alive = true;
    setState((s) => (s.status === "error" ? { status: "loading", slides: [] } : s));
    fetchSlides(key)
      .then((slides) => alive && setState({ status: "ready", slides }))
      .catch(() => alive && setState({ status: "error", slides: [] }));
    return () => { alive = false; };
  }, [key, tries]);
  return { ...state, retry: () => setTries((n) => n + 1) };
}
