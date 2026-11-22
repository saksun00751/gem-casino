"use client";
import * as React from "react";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSite } from "@/components/providers";
import { fetchProviders } from "@/lib/providers";
import { useT } from "@/components/i18n-provider";

type Game = { id: string; provider: string; name: string; image: string };
type State = "loading" | "ready" | "error";

const PAGE = 40; // games rendered per step (keeps the DOM small for big providers)
const TYPE_LABEL: Record<string, string> = { slot: "สล็อต", casino: "คาสิโน", sport: "กีฬา", keno: "คีโน่", card: "เกมไพ่", poker: "โป๊กเกอร์", cock: "ไก่ชน" };

// Safari blocks pop-ups opened after an await, so it navigates the current tab instead.
const isSafari = () => /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

function GameTile({ g, busy, onPlay }: { g: Game; busy: boolean; onPlay: (g: Game) => void }) {
  const t = useT();
  const [broken, setBroken] = React.useState(false);
  return (
    <li>
      <button onClick={() => onPlay(g)} disabled={busy} aria-label={t("เล่น {name}", { name: g.name })} className="group block w-full text-left active:scale-[0.97] disabled:opacity-70">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-gradient-to-b from-[#2b2b3a] to-[#14141c] shadow-[0_6px_14px_#0000006b]">
          {g.image && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.image} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span className="absolute inset-0 grid place-items-center p-2 text-center text-[length:calc(13px*var(--fs))] font-medium">{g.name}</span>
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-black/55" role="status" aria-label={t("กำลังเปิดเกม")}>
              <span className="size-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            </span>
          )}
        </div>
        <span className="mt-2 line-clamp-2 block text-[length:calc(12px*var(--fs))] font-medium leading-tight text-white md:text-[length:calc(14px*var(--fs))]">{g.name}</span>
      </button>
    </li>
  );
}

export default function ProviderGamesPage() {
  const t = useT();
  const { type = "", provider = "" } = useParams<{ type: string; provider: string }>();
  const { user, setLoginOpen } = useSite();
  const [state, setState] = React.useState<State>("loading");
  const [games, setGames] = React.useState<Game[]>([]);
  const [title, setTitle] = React.useState("");
  const [q, setQ] = React.useState("");
  const [shown, setShown] = React.useState(PAGE);
  const [launching, setLaunching] = React.useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = React.useState("");

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch(`/api/games/${encodeURIComponent(type)}/${encodeURIComponent(provider)}/`);
      const j = await r.json();
      if (!r.ok || !j.success) return setState("error");
      setGames(j.games);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [type, provider]);
  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    let alive = true;
    setTitle("");
    fetchProviders(type).then((list) => { if (alive) setTitle(list.find((p) => p.id.toLowerCase() === provider.toLowerCase())?.name ?? ""); }).catch(() => {});
    return () => { alive = false; };
  }, [type, provider]);

  const visible = React.useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? games.filter((g) => g.name.toLowerCase().includes(n)) : games;
  }, [games, q]);
  React.useEffect(() => setShown(PAGE), [q, type, provider]);

  // Load the next 40 automatically when the end of the list scrolls into view (the button stays as a fallback).
  const more = React.useRef<HTMLDivElement>(null);
  const hasMore = visible.length > shown;
  React.useEffect(() => {
    const el = more.current;
    if (!hasMore || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setShown((n) => n + PAGE); }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown]);

  async function play(g: Game) {
    if (!user) return setLoginOpen(true);
    if (launching) return;
    setLaunching(g.id);
    setFallbackUrl("");
    // Open the tab right now (inside the click) so the browser doesn't treat it as a pop-up, then point it at the game.
    const safari = isSafari();
    let win: Window | null = null;
    if (!safari) {
      win = window.open("", "_blank");
      if (win) win.opener = null;
    }
    try {
      const r = await fetch("/api/games/launch/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: g.provider, game: g.id }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success || !j.url) {
        win?.close();
        if (r.status === 401) return setLoginOpen(true);
        return void toast.error(j.message || t("ไม่สามารถเข้าเกมได้ กรุณาลองใหม่"));
      }
      if (safari) window.location.href = j.url;
      else if (win) win.location.href = j.url;
      else setFallbackUrl(j.url); // pop-up blocked: let the member open it with one more click
    } catch {
      win?.close();
      toast.error(t("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่"));
    } finally {
      setLaunching(null);
    }
  }

  const name = title || provider.toUpperCase();
  return (
    <SiteShell>
      <section className="mx-auto max-w-[1140px] px-[10px] pb-10 pt-4 md:px-6">
        <div className="mb-4 flex items-center gap-3">
          <Link href="/" aria-label={t("กลับหน้าแรก")} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-[20px] hover:bg-white/20">‹</Link>
          <div className="min-w-0">
            <p className="text-[length:calc(12px*var(--fs))] text-white/60">{TYPE_LABEL[type.toLowerCase()] ? t(TYPE_LABEL[type.toLowerCase()]) : type}</p>
            <h1 className="truncate text-[length:calc(20px*var(--fs))] font-medium leading-tight text-[var(--brand)]">{name}</h1>
            {state === "ready" && <p className="text-[length:calc(12px*var(--fs))] text-white/60">{t("{length} เกม", { length: games.length })}</p>}
          </div>
        </div>

        {!user && state === "ready" && games.length > 0 && (
          <p className="mb-3 rounded-[10px] bg-amber-500/20 px-4 py-2 text-center text-[length:calc(13px*var(--fs))] text-amber-100">
            {t("เข้าสู่ระบบเพื่อเล่นเกม{v}", { v: " " })}
            <button onClick={() => setLoginOpen(true)} className="font-medium text-[var(--brand)] underline">{t("เข้าสู่ระบบ")}</button>
          </p>
        )}
        {fallbackUrl && (
          <p role="status" className="mb-3 rounded-[10px] bg-emerald-500/25 px-4 py-2 text-center text-[length:calc(14px*var(--fs))] text-emerald-100">
            {t("เบราว์เซอร์บล็อกหน้าต่างใหม่{v}", { v: " " })}
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--brand)] underline">{t("คลิกที่นี่เพื่อเปิดเกม")}</a>
          </p>
        )}

        {state === "ready" && games.length > 8 && (
          <div className="mb-4">
            <Input type="search" aria-label={t("ค้นหาเกม")} placeholder={t("ค้นหาเกม")} value={q} onChange={(e) => setQ(e.target.value)} className="h-11 rounded-[30px] bg-white/10 px-4" />
          </div>
        )}

        {state === "loading" && (
          <ul className="grid grid-cols-3 gap-x-[10px] gap-y-4 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6" aria-busy="true">
            {Array.from({ length: 12 }).map((_, i) => <li key={i}><div className="aspect-[3/4] skeleton rounded-[10px]" /></li>)}
          </ul>
        )}
        {state === "error" && (
          <div className="grid justify-items-center gap-3 py-16 text-center">
            <p>{t("โหลดรายการเกมไม่สำเร็จ")}</p>
            <Button onClick={load} className="brand-gradient h-10 rounded-[30px] px-8">{t("ลองใหม่")}</Button>
          </div>
        )}
        {state === "ready" && games.length === 0 && <p className="py-16 text-center text-white/70">{t("ยังไม่มีเกมของผู้ให้บริการนี้")}</p>}
        {state === "ready" && games.length > 0 && visible.length === 0 && <p className="py-16 text-center text-white/70">{t("ไม่พบเกมที่ค้นหา")}</p>}

        {state === "ready" && visible.length > 0 && (
          <>
            <ul className="grid grid-cols-3 gap-x-[10px] gap-y-4 sm:grid-cols-4 md:grid-cols-5 md:gap-y-5 xl:grid-cols-6">
              {visible.slice(0, shown).map((g) => <GameTile key={g.id} g={g} busy={launching === g.id} onPlay={play} />)}
            </ul>
            {visible.length > shown && (
              <div ref={more} className="mt-6 text-center">
                <Button variant="outline" onClick={() => setShown((n) => n + PAGE)} className="h-10 rounded-[30px] border-[var(--brand)] bg-transparent px-8 text-white">{t("ดูเพิ่ม ({v})", { v: visible.length - shown })}</Button>
              </div>
            )}
          </>
        )}
      </section>
    </SiteShell>
  );
}
