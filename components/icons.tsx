import * as React from "react";

type P = { className?: string };

/** Shared gradient defs, rendered once per icon with a unique id prefix. */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe9a0" />
        <stop offset="1" stopColor="#e0922b" />
      </linearGradient>
      <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff8a65" />
        <stop offset="1" stopColor="#c62828" />
      </linearGradient>
      <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7fd6ff" />
        <stop offset="1" stopColor="#1e6fd0" />
      </linearGradient>
      <linearGradient id={`${id}-p`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d9a6ff" />
        <stop offset="1" stopColor="#7a3fd0" />
      </linearGradient>
      <linearGradient id={`${id}-n`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8af0c0" />
        <stop offset="1" stopColor="#1f9a6a" />
      </linearGradient>
    </defs>
  );
}

const svgProps = { viewBox: "0 0 64 64", "aria-hidden": true, focusable: false } as const;

/** Regular pentagon as an SVG points string (used for the football panels). */
export function pent(cx: number, cy: number, r: number, rotDeg = 0) {
  return Array.from({ length: 5 }, (_, i) => {
    const a = ((rotDeg - 90 + i * 72) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

/** A glossy 3D ball: radial shading, white number disc and a specular highlight. */
function Ball({ id, cx, cy, r, c1, c2, c3, label }: { id: string; cx: number; cy: number; r: number; c1: string; c2: string; c3: string; label: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="34%" cy="28%" r="80%">
          <stop offset="0" stopColor={c1} />
          <stop offset="0.55" stopColor={c2} />
          <stop offset="1" stopColor={c3} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
      <circle cx={cx} cy={cy} r={r * 0.52} fill="#fffdf5" />
      <text x={cx} y={cy + r * 0.2} textAnchor="middle" fontSize={r * 0.62} fontWeight="800" fontFamily="Arial, Helvetica, sans-serif" fill="#2b2b33">{label}</text>
      <ellipse cx={cx - r * 0.38} cy={cy - r * 0.52} rx={r * 0.3} ry={r * 0.17} fill="#fff" opacity="0.6" transform={`rotate(-35 ${cx - r * 0.38} ${cy - r * 0.52})`} />
    </g>
  );
}


/** Colours for one fighting rooster; values may be hex or url(#gradient). */
export type RoosterPaint = { body: string; wing: string; tail1: string; tail2: string; comb: string; beak: string; leg: string; line: string; sheen?: string };

/** A rooster facing right, mid-lunge: spread wing, stretched neck, open beak, kicking leg with spur. */
export function Rooster({ c }: { c: RoosterPaint }) {
  return (
    <g transform="translate(5 0)" strokeLinejoin="round" strokeLinecap="round">
      {/* tail plumes */}
      <path d="M9 27C0 25-2 12 5 3c1 8 5 12 9 15z" fill={c.tail1} stroke={c.line} strokeWidth="1" />
      <path d="M8 31C-2 32-5 23-2 14c3 6 8 9 13 10z" fill={c.tail2} stroke={c.line} strokeWidth="1" />
      {/* back leg */}
      <path d="M18 42l-1 7M12.5 49.5H21" fill="none" stroke={c.leg} strokeWidth="2.6" />
      {/* body */}
      <path d="M9 26c2-8 12-10 19-6 6 4 7 13 2 19-5 6-16 6-20-1-3-4-3-8-1-12z" fill={c.body} stroke={c.line} strokeWidth="1.2" />
      {/* spread wing */}
      <path d="M13 27C10 21 9 17 11 12c5 3 10 8 12 13-3 4-7 5-10 2z" fill={c.wing} stroke={c.line} strokeWidth="1" />
      <path d="M13.5 24l8 2M12 20l8 3.5" fill="none" stroke={c.line} strokeOpacity="0.55" strokeWidth="0.9" />
      {c.sheen && <path d="M14 36c3 3 9 4 14 1" fill="none" stroke={c.sheen} strokeWidth="1.6" opacity="0.7" />}
      {/* neck + head */}
      <path d="M26 21c2-7 5-12 9-13l4 7c-4 2-7 6-8 11z" fill={c.body} stroke={c.line} strokeWidth="1" />
      <circle cx="37" cy="11" r="5.6" fill={c.body} stroke={c.line} strokeWidth="1.2" />
      <circle cx="34" cy="5.8" r="2.4" fill={c.comb} /><circle cx="37.6" cy="4.5" r="2.7" fill={c.comb} /><circle cx="40.8" cy="6.4" r="2.2" fill={c.comb} />
      <path d="M41.5 9l8 1.8-7.5 1.6z" fill={c.beak} stroke={c.line} strokeWidth="0.8" />
      <path d="M41.7 13.2l6 1.8-6.3 0.4z" fill={c.beak} stroke={c.line} strokeWidth="0.8" />
      <ellipse cx="39.8" cy="17.4" rx="2" ry="3" fill={c.comb} />
      <circle cx="38.6" cy="10" r="1.8" fill="#fff" /><circle cx="39" cy="10.2" r="1" fill="#111" />
      {/* kicking leg, spur and talons */}
      <path d="M27 38l5 5 6-2" fill="none" stroke={c.leg} strokeWidth="2.6" />
      <path d="M38 41l3.2-1.8M38 41l3.4 1.2M38 41l2.4 3" fill="none" stroke={c.leg} strokeWidth="1.5" />
      <path d="M30.6 42.6L27 48l5.2-2.6z" fill="#e8ecf2" stroke="#7b8494" strokeWidth="0.8" />
    </g>
  );
}

/** Two roosters squared up beak to beak, with an impact burst and flying feathers between them. */
export function Fighters({ a, b, burst, shadow = true, feathers = ["#d3172a", "#1a8f4c", "#ffb347"] }: { a: RoosterPaint; b: RoosterPaint; burst: string; shadow?: boolean; feathers?: string[] }) {
  const star = Array.from({ length: 16 }, (_, i) => {
    const ang = (i * Math.PI) / 8 - Math.PI / 2, r = i % 2 ? 6.5 : 12.5;
    return `${(32 + r * Math.cos(ang)).toFixed(1)},${(24 + r * Math.sin(ang)).toFixed(1)}`;
  }).join(" ");
  return (
    <>
      {shadow && <ellipse cx="32" cy="60.5" rx="26" ry="2.4" fill="#000" opacity="0.3" />}
      <polygon points={star} fill={burst} opacity="0.95" />
      <circle cx="32" cy="24" r="3.2" fill="#fff" opacity="0.9" />
      <g transform="translate(0 17) scale(0.6)"><Rooster c={a} /></g>
      <g transform="translate(64 17) scale(-0.6 0.6)"><Rooster c={b} /></g>
      <ellipse cx="25" cy="9" rx="3.4" ry="1.3" fill={feathers[0]} transform="rotate(-35 25 9)" />
      <ellipse cx="38" cy="7.5" rx="3.4" ry="1.3" fill={feathers[1]} transform="rotate(30 38 7.5)" />
      <ellipse cx="32" cy="12.5" rx="2.6" ry="1" fill={feathers[2]} transform="rotate(-10 32 12.5)" />
    </>
  );
}

export const REALISTIC: Record<string, (id: string) => React.ReactNode> = {
  /* Layered flame: red outer, orange body, yellow inner, white-hot core + sparks */
  hot: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-f1`} cx="50%" cy="88%" r="85%">
          <stop offset="0" stopColor="#ffd84d" /><stop offset="0.4" stopColor="#ff8a1c" /><stop offset="1" stopColor="#d9261a" />
        </radialGradient>
        <radialGradient id={`${id}-f2`} cx="50%" cy="92%" r="75%">
          <stop offset="0" stopColor="#fffbe2" /><stop offset="0.5" stopColor="#ffe46d" /><stop offset="1" stopColor="#ffa621" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="59" rx="14" ry="2.6" fill="#000" opacity="0.28" />
      <path d="M33 2c2 12 16 18 16 34 0 13-7 22-17 22S15 49 15 38c0-8 4-13 8-17 0 6 2 9 5 10-2-11 0-21 5-29z" fill={`url(#${id}-f1)`} />
      <path d="M32 26c1 7 9 10 9 19 0 6-4 11-9 11s-9-5-9-11c0-5 3-8 5-11 1 3 2 4 4 4-1-5-1-8 0-12z" fill={`url(#${id}-f2)`} />
      <ellipse cx="32" cy="50" rx="5" ry="6.5" fill="#fffef2" opacity="0.92" />
      <path d="M21 41c-1-6 1-10 4-13" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="49" cy="18" r="1.8" fill="#ffd84d" /><circle cx="13" cy="26" r="1.4" fill="#ff9a2e" /><circle cx="52" cy="30" r="1.2" fill="#ffd84d" />
    </>
  ),

  /* Fanned playing cards (A♥ / spade) with a casino chip in front */
  casino: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dfe3ea" /></linearGradient>
        <radialGradient id={`${id}-chip`} cx="38%" cy="30%" r="80%"><stop offset="0" stopColor="#ff6b5e" /><stop offset="0.6" stopColor="#d3172a" /><stop offset="1" stopColor="#8d0b1a" /></radialGradient>
      </defs>
      <g transform="rotate(-16 22 30)">
        <rect x="9" y="9" width="28" height="40" rx="4" fill={`url(#${id}-card)`} stroke="#aab0bd" strokeWidth="1.3" />
        <text x="13" y="21" fontSize="10" fontWeight="800" fontFamily="Arial, Helvetica, sans-serif" fill="#d3172a">A</text>
        <path transform="translate(23 33) scale(0.95)" d="M0 10C-12 2-12-8-6-9 -3-9.5-1-8 0-5.5 1-8 3-9.5 6-9 12-8 12 2 0 10z" fill="#d3172a" />
      </g>
      <g transform="rotate(12 39 29)">
        <rect x="25" y="8" width="28" height="40" rx="4" fill={`url(#${id}-card)`} stroke="#aab0bd" strokeWidth="1.3" />
        <text x="29" y="20" fontSize="10" fontWeight="800" fontFamily="Arial, Helvetica, sans-serif" fill="#1d1f2b">A</text>
        <path transform="translate(39 30) scale(0.78)" d="M0-10C-9-2-11 2-11 5A5 5 0 0 0-2 6.5C-2.5 9-3.5 11-5.5 13H5.5C3.5 11 2.5 9 2 6.5A5 5 0 0 0 11 5C11 2 9-2 0-10z" fill="#1d1f2b" />
      </g>
      <ellipse cx="45" cy="57" rx="13" ry="2.6" fill="#000" opacity="0.3" />
      <circle cx="45" cy="47" r="13" fill={`url(#${id}-chip)`} stroke="#7a0a16" strokeWidth="1.2" />
      <circle cx="45" cy="47" r="10.2" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="5.2 4.4" />
      <circle cx="45" cy="47" r="6.6" fill="#a50f20" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.2" />
      <path d="M45 43.4l1.2 2.5 2.7.3-2 1.9.6 2.7-2.5-1.4-2.5 1.4.6-2.7-2-1.9 2.7-.3z" fill="#ffe27a" />
      <ellipse cx="40" cy="40.5" rx="5" ry="2.4" fill="#fff" opacity="0.35" transform="rotate(-35 40 40.5)" />
    </>
  ),

  /* Slot machine: red body, lit sign, 777 reels, coin tray and lever */
  slot: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff6a58" /><stop offset="0.5" stopColor="#e02a2a" /><stop offset="1" stopColor="#a60f1c" /></linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff0a8" /><stop offset="1" stopColor="#d9902a" /></linearGradient>
        <radialGradient id={`${id}-knob`} cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#ff8d80" /><stop offset="1" stopColor="#b3121f" /></radialGradient>
      </defs>
      <ellipse cx="31" cy="60" rx="22" ry="2.6" fill="#000" opacity="0.3" />
      <path d="M50 26l5-12" stroke="#c9ced6" strokeWidth="3" strokeLinecap="round" /><path d="M50 26l5-12" stroke="#fff" strokeOpacity="0.6" strokeWidth="1" strokeLinecap="round" />
      <circle cx="56" cy="11.5" r="5" fill={`url(#${id}-knob)`} /><circle cx="54.5" cy="9.8" r="1.6" fill="#fff" opacity="0.6" />
      <rect x="8" y="5" width="43" height="52" rx="7" fill={`url(#${id}-body)`} stroke="#6d0a12" strokeWidth="1.6" />
      <rect x="13" y="9" width="33" height="9" rx="3" fill={`url(#${id}-gold)`} stroke="#8a5a10" strokeWidth="1" />
      {[19, 29.5, 40].map((x) => <circle key={x} cx={x} cy="13.5" r="2" fill="#fff" stroke="#c98a1e" strokeWidth="0.8" />)}
      <rect x="12" y="21" width="35" height="20" rx="3.5" fill="#181822" stroke="#f1c24b" strokeWidth="1.6" />
      {[14.5, 25.5, 36.5].map((x, i) => (
        <g key={x}>
          <rect x={x} y="23.5" width="8.5" height="15" rx="1.6" fill="#fbfbf6" />
          <text x={x + 4.25} y="35" textAnchor="middle" fontSize="12.5" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" fill={i === 1 ? "#e0a020" : "#d3172a"}>7</text>
        </g>
      ))}
      <rect x="12" y="21" width="35" height="7" rx="3" fill="#fff" opacity="0.14" />
      <rect x="15" y="45" width="29" height="8" rx="3" fill="#2a0709" stroke="#f1c24b" strokeWidth="1" />
      <ellipse cx="29.5" cy="50.5" rx="5.5" ry="2" fill={`url(#${id}-gold)`} /><ellipse cx="29.5" cy="49.6" rx="5.5" ry="2" fill="#ffe27a" />
    </>
  ),

  /* Football: shaded sphere with black panels and seams */
  sport: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-ball`} cx="36%" cy="30%" r="80%"><stop offset="0" stopColor="#ffffff" /><stop offset="0.65" stopColor="#e4e8ec" /><stop offset="1" stopColor="#a9b1ba" /></radialGradient>
        <clipPath id={`${id}-clip`}><circle cx="32" cy="31" r="23" /></clipPath>
      </defs>
      <ellipse cx="32" cy="58.5" rx="15" ry="2.8" fill="#000" opacity="0.32" />
      <circle cx="32" cy="31" r="23" fill={`url(#${id}-ball)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <polygon points={pent(32, 31, 7.2, 0)} fill="#1c2026" />
        {[[32, 8, 36], [54, 24, 0], [47, 53, 36], [17, 53, 0], [10, 24, 36]].map(([x, y, rot]) => (
          <polygon key={`${x}${y}`} points={pent(x, y, 7.6, rot)} fill="#1c2026" />
        ))}
        <path d="M32 24V13M38.8 28.6L50 25M36.2 36.8L44 47M27.8 36.8L20 47M25.2 28.6L14 25" stroke="#1c2026" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="32" cy="31" r="23" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="6" />
      </g>
      <circle cx="32" cy="31" r="23" fill="none" stroke="#2c323a" strokeWidth="1.4" />
      <ellipse cx="23" cy="17.5" rx="7" ry="3.8" fill="#fff" opacity="0.65" transform="rotate(-35 23 17.5)" />
    </>
  ),

  /* Lottery balls: three glossy numbered spheres */
  lotto: (id) => (
    <>
      <ellipse cx="32" cy="60" rx="25" ry="2.8" fill="#000" opacity="0.3" />
      <Ball id={`${id}-b1`} cx={22} cy={40} r={18} c1="#ff8a7a" c2="#e02b2b" c3="#8f0d18" label="10" />
      <Ball id={`${id}-b2`} cx={44} cy={21} r={14} c1="#8fd0ff" c2="#1f7ae0" c3="#0c3f8f" label="29" />
      <Ball id={`${id}-b3`} cx={49} cy={46} r={10.5} c1="#fff0a0" c2="#f2b01e" c3="#a8690a" label="7" />
    </>
  ),

  /* Fish: shaded body, fins, scales, gill, glossy eye and bubbles */
  fishing: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5fe0ff" /><stop offset="0.55" stopColor="#1f93e8" /><stop offset="1" stopColor="#0f55b5" /></linearGradient>
        <linearGradient id={`${id}-fin`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffb347" /><stop offset="1" stopColor="#e2561b" /></linearGradient>
      </defs>
      <path d="M44 28L60 14c2 6 2 12 0 18 2 6 2 12 0 18L44 38z" fill={`url(#${id}-fin)`} stroke="#a63a0e" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M23 21c3-9 13-10 17-3-6-1-11 0-17 3z" fill={`url(#${id}-fin)`} stroke="#a63a0e" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 33C14 16 36 13 47 28c-1 2-1 4 0 6C36 50 14 50 7 33z" fill={`url(#${id}-body)`} stroke="#0b4a9a" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 36c6 11 26 11 36-1-6 8-20 12-36 1z" fill="#d8f4ff" opacity="0.55" />
      {[[30, 28], [37, 31], [30, 35], [24, 31]].map(([x, y]) => <path key={`${x}${y}`} d={`M${x - 3} ${y}a3 3 0 0 1 6 0`} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.1" />)}
      <path d="M26 38c4 4 9 6 12 5-3-3-5-6-6-9z" fill={`url(#${id}-fin)`} stroke="#a63a0e" strokeWidth="1" strokeLinejoin="round" />
      <path d="M19 21c-3 5-3 11 0 17" fill="none" stroke="#0b4a9a" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="14.5" cy="29" r="4.2" fill="#fff" stroke="#0b4a9a" strokeWidth="1" /><circle cx="14" cy="29.2" r="2.3" fill="#10131c" /><circle cx="13.1" cy="28.2" r="0.9" fill="#fff" />
      <path d="M8.6 34.2c1.2.9 2.6 1.1 3.8.6" fill="none" stroke="#0b4a9a" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="29" cy="21.5" rx="9" ry="2.6" fill="#fff" opacity="0.4" transform="rotate(-8 29 21.5)" />
      <circle cx="8" cy="19" r="3" fill="#bfeaff" fillOpacity="0.35" stroke="#e8f8ff" strokeWidth="1" /><circle cx="13" cy="10" r="2" fill="#bfeaff" fillOpacity="0.35" stroke="#e8f8ff" strokeWidth="1" /><circle cx="5" cy="9" r="1.4" fill="#bfeaff" fillOpacity="0.35" stroke="#e8f8ff" strokeWidth="0.9" />
    </>
  ),

  /* Mahjong red-dragon tile (the card/poker/keno group, like the reference's tile emoji) */
  cardgroup: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffef6" /><stop offset="1" stopColor="#e6dcbc" /></linearGradient>
        <linearGradient id={`${id}-back`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2ba85a" /><stop offset="1" stopColor="#0c5a2c" /></linearGradient>
      </defs>
      <ellipse cx="33" cy="60" rx="18" ry="2.6" fill="#000" opacity="0.3" />
      <rect x="17" y="12" width="34" height="46" rx="7" fill={`url(#${id}-back)`} stroke="#07391b" strokeWidth="1.4" />
      <rect x="14" y="8" width="34" height="46" rx="7" fill={`url(#${id}-face)`} stroke="#b4a97f" strokeWidth="1.4" />
      <rect x="18.5" y="12.5" width="25" height="37" rx="4" fill="none" stroke="#c9bd92" strokeWidth="1" />
      <rect x="24.5" y="22" width="13" height="16" rx="1.5" fill="none" stroke="#d3172a" strokeWidth="4.2" />
      <path d="M31 14v32" stroke="#d3172a" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M17 14c2-3 7-4 12-4" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  /* Fighting cocks: red-orange vs black-green, beak to beak */
  cock: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffb347" /><stop offset="0.6" stopColor="#e2561b" /><stop offset="1" stopColor="#9a2a0c" /></linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6b7a8c" /><stop offset="0.55" stopColor="#222b38" /><stop offset="1" stopColor="#090c11" /></linearGradient>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2fd07a" /><stop offset="1" stopColor="#0c4f2a" /></linearGradient>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38d5c4" /><stop offset="1" stopColor="#0b4f66" /></linearGradient>
        <radialGradient id={`${id}-burst`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fff7c2" /><stop offset="0.6" stopColor="#ffd23d" /><stop offset="1" stopColor="#ff8a1c" /></radialGradient>
      </defs>
      <Fighters
        a={{ body: `url(#${id}-a)`, wing: "#b13a10", tail1: `url(#${id}-g)`, tail2: "#d3172a", comb: "#d3172a", beak: "#ffd23d", leg: "#e0a82e", line: "#6a1f06" }}
        b={{ body: `url(#${id}-b)`, wing: "#0f141c", tail1: `url(#${id}-t)`, tail2: "#1a8f4c", comb: "#e0262e", beak: "#e8c24a", leg: "#c9a13a", line: "#04070b", sheen: "#5eead4" }}
        burst={`url(#${id}-burst)`}
      />
    </>
  ),

  /* Dartboard with a dart stuck near the bullseye */
  skill: (id) => (
    <>
      <defs>
        <radialGradient id={`${id}-bull`} cx="38%" cy="32%" r="80%"><stop offset="0" stopColor="#ff7a6e" /><stop offset="1" stopColor="#b3121f" /></radialGradient>
      </defs>
      <ellipse cx="30" cy="59.5" rx="20" ry="2.6" fill="#000" opacity="0.3" />
      <circle cx="30" cy="32" r="27" fill="#14161c" stroke="#555b66" strokeWidth="1.4" />
      <circle cx="30" cy="32" r="23.5" fill="#efe2b8" />
      {Array.from({ length: 20 }, (_, i) => {
        // 20 wedges like a real board; double/treble rings take the opposite colour of their wedge.
        const a1 = ((i * 18 - 9) * Math.PI) / 180, a2 = (((i + 1) * 18 - 9) * Math.PI) / 180;
        const pt = (r: number, a: number) => `${(30 + r * Math.cos(a)).toFixed(2)} ${(32 + r * Math.sin(a)).toFixed(2)}`;
        const wedge = `M30 32L${pt(23.5, a1)}A23.5 23.5 0 0 1 ${pt(23.5, a2)}Z`;
        const ring = (r1: number, r2: number) => `M${pt(r2, a1)}A${r2} ${r2} 0 0 1 ${pt(r2, a2)}L${pt(r1, a2)}A${r1} ${r1} 0 0 0 ${pt(r1, a1)}Z`;
        const dark = i % 2 === 0;
        return (
          <g key={i}>
            <path d={wedge} fill={dark ? "#1b1d24" : "#efe2b8"} />
            <path d={ring(20.2, 23.5)} fill={dark ? "#c62828" : "#1f8a46"} />
            <path d={ring(11.6, 14.6)} fill={dark ? "#c62828" : "#1f8a46"} />
          </g>
        );
      })}
      <circle cx="30" cy="32" r="5.2" fill="#1f8a46" /><circle cx="30" cy="32" r="2.6" fill={`url(#${id}-bull)`} />
      <circle cx="30" cy="32" r="27" fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="2" />
      <ellipse cx="18" cy="14" rx="8" ry="3" fill="#fff" opacity="0.2" transform="rotate(-40 18 14)" />
      <path d="M31 31l3-3" stroke="#d0d5dd" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M34 28l8-8" stroke="#e0a82e" strokeWidth="4.6" strokeLinecap="round" /><path d="M34.2 27.2l7.4-7.4" stroke="#fff3b8" strokeOpacity="0.6" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M42 20l5-5" stroke="#2a2d36" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M46 16l4-11 5 3z" fill="#e02b2b" stroke="#8f0d18" strokeWidth="0.8" strokeLinejoin="round" /><path d="M46 16l11-4 2 5z" fill="#ff5b4a" stroke="#8f0d18" strokeWidth="0.8" strokeLinejoin="round" />
    </>
  ),

  /* Game controller: dark body, D-pad, coloured buttons and two sticks */
  esport: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}-pad`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a5f78" /><stop offset="0.5" stopColor="#2f3347" /><stop offset="1" stopColor="#171925" /></linearGradient>
        <radialGradient id={`${id}-stick`} cx="38%" cy="30%" r="80%"><stop offset="0" stopColor="#6b7088" /><stop offset="1" stopColor="#1b1d2a" /></radialGradient>
      </defs>
      <ellipse cx="32" cy="58.5" rx="23" ry="2.8" fill="#000" opacity="0.3" />
      <rect x="11" y="11" width="13" height="5" rx="2.5" fill="#2a2d3d" stroke="#10121b" strokeWidth="1" /><rect x="40" y="11" width="13" height="5" rx="2.5" fill="#2a2d3d" stroke="#10121b" strokeWidth="1" />
      <path d="M12 22c4-6 10-8 16-8h8c6 0 12 2 16 8 5 8 8 22 4 28-3 5-10 4-13-2l-3-5H24l-3 5c-3 6-10 7-13 2-4-6-1-20 4-28z" fill={`url(#${id}-pad)`} stroke="#0e0f16" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 23c4-5 9-6 14-6h4c5 0 10 1 14 6" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="21" cy="27" r="5.6" fill="#0d0e15" /><circle cx="21" cy="27" r="4.3" fill={`url(#${id}-stick)`} /><circle cx="19.8" cy="25.8" r="1.2" fill="#fff" opacity="0.35" />
      <rect x="21.5" y="36.6" width="11" height="4.2" rx="1.4" fill="#d5d9e6" /><rect x="24.9" y="33.2" width="4.2" height="11" rx="1.4" fill="#d5d9e6" />
      <circle cx="38" cy="39" r="5.6" fill="#0d0e15" /><circle cx="38" cy="39" r="4.3" fill={`url(#${id}-stick)`} /><circle cx="36.8" cy="37.8" r="1.2" fill="#fff" opacity="0.35" />
      {[[45, 22.5, "#ffd23d"], [50.5, 28, "#e8383d"], [45, 33.5, "#38c46a"], [39.5, 28, "#3a8dff"]].map(([x, y, c]) => (
        <g key={`${x}${y}`}><circle cx={x as number} cy={y as number} r="3.2" fill={c as string} stroke="#0e0f16" strokeWidth="0.8" /><circle cx={(x as number) - 0.9} cy={(y as number) - 1} r="1" fill="#fff" opacity="0.55" /></g>
      ))}
      <circle cx="29" cy="24" r="1.5" fill="#9aa0b8" /><circle cx="35" cy="24" r="1.5" fill="#9aa0b8" />
    </>
  ),
};

const ICONS: Record<string, (id: string) => React.ReactNode> = {
  hot: (id) => (
    <>
      <path d="M32 4c2 10 14 14 14 28 0 10-6 18-14 18S18 42 18 32c0-6 3-9 6-12 0 5 2 7 4 8 0-9 1-17 4-24z" fill={`url(#${id}-r)`} />
      <path d="M32 26c1 6 8 8 8 16 0 5-3 9-8 9s-8-4-8-9c0-4 3-6 4-9 1 2 2 3 4 3 0-4 0-7 0-10z" fill={`url(#${id}-g)`} />
    </>
  ),
  casino: (id) => (
    <>
      <rect x="10" y="12" width="28" height="40" rx="4" fill="#fff" stroke="#7a1f5c" strokeWidth="2" transform="rotate(-14 24 32)" />
      <rect x="26" y="10" width="28" height="40" rx="4" fill={`url(#${id}-p)`} stroke="#3a1a70" strokeWidth="2" transform="rotate(10 40 30)" />
      <path d="M40 24l4 6-4 8-4-8z" fill="#ffe08a" transform="rotate(10 40 30)" />
    </>
  ),
  slot: (id) => (
    <>
      <rect x="10" y="8" width="44" height="48" rx="8" fill={`url(#${id}-p)`} stroke="#3a1a70" strokeWidth="2" />
      <rect x="16" y="16" width="32" height="18" rx="3" fill="#fff" />
      <path d="M26 16v18M38 16v18" stroke="#c8c8d8" strokeWidth="2" />
      <circle cx="21" cy="25" r="3.5" fill="#d33" /><circle cx="32" cy="25" r="3.5" fill="#e0a020" /><circle cx="43" cy="25" r="3.5" fill="#d33" />
      <rect x="18" y="40" width="28" height="8" rx="4" fill={`url(#${id}-g)`} />
    </>
  ),
  lotto: (id) => (
    <>
      <circle cx="24" cy="38" r="17" fill="#fff" stroke="#555" strokeWidth="2" />
      <text x="24" y="44" textAnchor="middle" fontSize="16" fontWeight="700" fill="#222">10</text>
      <circle cx="44" cy="20" r="13" fill="#fff" stroke="#555" strokeWidth="2" />
      <text x="44" y="25" textAnchor="middle" fontSize="12" fontWeight="700" fill="#222">29</text>
    </>
  ),
  puzzle: (id) => (
    <path
      d="M10 22h12a6 6 0 1 1 12 0h12v12a6 6 0 1 1 0 12v10H34a6 6 0 1 0-12 0H10V46a6 6 0 1 0 0-12z"
      fill={`url(#${id}-n)`} stroke="#0d5a3a" strokeWidth="2" strokeLinejoin="round"
    />
  ),
  arcade: (id) => (
    <>
      <rect x="10" y="44" width="44" height="12" rx="6" fill="#444" />
      <rect x="14" y="40" width="36" height="10" rx="5" fill="#666" />
      <rect x="29" y="22" width="6" height="22" rx="3" fill="#bbb" />
      <circle cx="32" cy="16" r="10" fill={`url(#${id}-r)`} />
      <circle cx="29" cy="13" r="3" fill="#ffffff88" />
    </>
  ),
  sport: (id) => (
    <>
      <circle cx="32" cy="32" r="24" fill="#fff" stroke="#222" strokeWidth="2.5" />
      <path d="M32 20l10 7-4 12H26l-4-12z" fill="#222" />
      <path d="M32 20V8M42 27l12-4M38 39l8 10M26 39l-8 10M22 27L10 23" stroke="#222" strokeWidth="2.5" fill="none" />
    </>
  ),
  race: (id) => (
    <>
      <path d="M6 40l6-12c1-3 3-4 6-4h24c3 0 5 1 7 4l8 10c2 1 3 3 3 5v3H6z" fill={`url(#${id}-r)`} />
      <path d="M18 28h12v8H14zM34 28h8c2 0 3 1 4 3l3 5H34z" fill="#bfe8ff" />
      <circle cx="19" cy="46" r="7" fill="#222" /><circle cx="19" cy="46" r="3" fill="#aaa" />
      <circle cx="47" cy="46" r="7" fill="#222" /><circle cx="47" cy="46" r="3" fill="#aaa" />
    </>
  ),
  fishing: (id) => (
    <>
      <path d="M6 32c8-14 24-18 36-8l10-8v32l-10-8C30 50 14 46 6 32z" fill={`url(#${id}-b)`} />
      <path d="M20 24c4 2 6 6 6 8s-2 6-6 8c-2-4-2-12 0-16z" fill="#ffffff55" />
      <circle cx="16" cy="29" r="3" fill="#fff" /><circle cx="16" cy="29" r="1.5" fill="#111" />
    </>
  ),
  skill: (id) => (
    <>
      <circle cx="32" cy="32" r="26" fill="#fff" stroke="#c62828" strokeWidth="2" />
      <circle cx="32" cy="32" r="19" fill={`url(#${id}-r)`} />
      <circle cx="32" cy="32" r="12" fill="#fff" />
      <circle cx="32" cy="32" r="6" fill="#c62828" />
      <path d="M32 32L54 10" stroke="#555" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 6l8 0-2 8z" fill="#e0922b" />
    </>
  ),
  esport: (id) => (
    <>
      <path d="M14 20h36c6 0 10 5 11 12l2 14c1 5-5 8-9 4l-6-8H20l-6 8c-4 4-10 1-9-4l2-14c1-7 5-12 7-12z" fill={`url(#${id}-p)`} stroke="#3a1a70" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 28v10M15 33h10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="43" cy="30" r="2.8" fill="#fff" /><circle cx="49" cy="36" r="2.8" fill="#fff" />
    </>
  ),
};

export function CategoryIcon({ id, className }: P & { id: string }) {
  const uid = `ci-${id}`;
  const draw = REALISTIC[id] ?? ICONS[id] ?? REALISTIC.hot;
  return (
    <svg {...svgProps} className={className}>
      <Defs id={uid} />
      {draw(uid)}
    </svg>
  );
}

export function LogoMark({ className }: P) {
  return (
    <svg {...svgProps} className={className}>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a0" /><stop offset="1" stopColor="#d08a20" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#111" stroke="url(#lm-g)" strokeWidth="3" />
      <path d="M32 11l6.5 13.4 14.6 2-10.6 10.3 2.6 14.6L32 44.2 18.9 51.3l2.6-14.6L10.9 26.4l14.6-2z" fill="url(#lm-g)" />
    </svg>
  );
}

const GOLD = "#e8a43a";
export function FooterIcon({ kind, className }: P & { kind: "security" | "fast" | "support" }) {
  return (
    <svg {...svgProps} className={className} fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {kind === "security" && (
        <>
          <path d="M32 6l20 7v16c0 14-9 24-20 29C21 53 12 43 12 29V13z" />
          <path d="M23 32l6 6 12-13" />
        </>
      )}
      {kind === "fast" && <path d="M36 4L12 36h18l-4 24 26-34H34z" />}
      {kind === "support" && (
        <>
          <circle cx="32" cy="20" r="8" /><path d="M16 56c0-10 7-16 16-16s16 6 16 16" />
          <path d="M14 30v-4a18 18 0 0 1 36 0v4" /><rect x="10" y="28" width="6" height="10" rx="2" /><rect x="48" y="28" width="6" height="10" rx="2" />
        </>
      )}
    </svg>
  );
}

/** Header tab icons (3D-ish, gradient filled). */
export function NavIcon({ kind, className }: P & { kind: "home" | "news" | "star" | "dice" | "user" | "deposit" | "withdraw" | "contact" }) {
  const id = `ni-${kind}`;
  return (
    <svg {...svgProps} className={className}>
      <defs>
        <linearGradient id={`${id}-y`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe08a" /><stop offset="1" stopColor="#f0902a" /></linearGradient>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#c9d2d6" /></linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6a6a" /><stop offset="1" stopColor="#b01c2e" /></linearGradient>
      </defs>
      {kind === "home" && (
        <>
          <path d="M8 30L32 8l24 22" fill="none" stroke={`url(#${id}-r)`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 30v24h36V30L32 14z" fill={`url(#${id}-w)`} />
          <rect x="27" y="38" width="10" height="16" rx="2" fill="#b01c2e" />
        </>
      )}
      {kind === "news" && (
        <>
          <rect x="8" y="12" width="48" height="40" rx="6" fill={`url(#${id}-w)`} />
          <rect x="14" y="19" width="16" height="14" rx="2" fill="#2a8f80" />
          <path d="M36 21h14M36 28h14M14 40h36M14 46h28" stroke="#5a6a72" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === "star" && (
        <path d="M32 5l8.2 17 18.8 2.4-13.8 12.9 3.6 18.5L32 46.6 15.2 55.8l3.6-18.5L5 24.4 23.8 22z" fill={`url(#${id}-y)`} stroke="#c0701a" strokeWidth="2" strokeLinejoin="round" />
      )}
      {kind === "dice" && (
        <>
          <rect x="8" y="8" width="48" height="48" rx="10" fill={`url(#${id}-w)`} stroke="#8a98a0" strokeWidth="2" />
          {[[20, 20], [44, 20], [32, 32], [20, 44], [44, 44]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4.5" fill="#222" />)}
        </>
      )}
      {kind === "deposit" && (
        <>
          <path d="M10 38h44v14a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5z" fill={`url(#${id}-w)`} stroke="#8a98a0" strokeWidth="2" />
          <circle cx="32" cy="20" r="14" fill={`url(#${id}-y)`} stroke="#c0701a" strokeWidth="2" />
          <path d="M32 12v16M25 22l7 7 7-7" fill="none" stroke="#9a4d08" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === "withdraw" && (
        <>
          <path d="M10 38h44v14a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5z" fill={`url(#${id}-r)`} />
          <circle cx="32" cy="20" r="14" fill={`url(#${id}-y)`} stroke="#c0701a" strokeWidth="2" />
          <path d="M32 28V12M25 18l7-7 7 7" fill="none" stroke="#9a4d08" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === "contact" && (
        <>
          <path d="M10 14a6 6 0 0 1 6-6h32a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H30L16 56V44h0a6 6 0 0 1-6-6z" fill={`url(#${id}-w)`} stroke="#8a98a0" strokeWidth="2" strokeLinejoin="round" />
          {[22, 32, 42].map((x) => <circle key={x} cx={x} cy="26" r="4" fill="#2a8f80" />)}
        </>
      )}
      {kind === "user" && (
        <>
          <circle cx="32" cy="21" r="12" fill={`url(#${id}-y)`} />
          <path d="M8 58c0-14 10-22 24-22s24 8 24 22z" fill={`url(#${id}-y)`} />
        </>
      )}
    </svg>
  );
}
