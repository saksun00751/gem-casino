// Colour themes (CSS in app/globals.css: html[data-theme="..."]). Plain module so server and client can both import it.
export const THEMES = [
  { id: "emerald", label: "มรกต", swatch: "#2c6b55", ring: "#f2ab39" },
  { id: "ruby", label: "ทับทิม", swatch: "#6b1f2c", ring: "#ffb347" },
  { id: "sapphire", label: "ไพลิน", swatch: "#1d3f73", ring: "#4fd1ff" },
  { id: "violet", label: "อเมทิสต์", swatch: "#4a2a78", ring: "#f5a3ff" },
  { id: "midnight", label: "รัตติกาล", swatch: "#2a2a2a", ring: "#e6e6e6" },
  { id: "rose", label: "กุหลาบ", swatch: "#7a2a55", ring: "#ff8fc0" },
  { id: "sunset", label: "พระอาทิตย์ตก", swatch: "#8a3d1c", ring: "#ffb44a" },
  { id: "ocean", label: "มหาสมุทร", swatch: "#0f5a66", ring: "#5eead4" },
  { id: "forest", label: "ป่าเขียว", swatch: "#3d5a1f", ring: "#c6e23a" },
  { id: "coffee", label: "กาแฟ", swatch: "#5a3d2a", ring: "#e6b36a" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "emerald";

/**
 * Theme from the environment (server only):
 *   SITE_THEME=<id>       default theme for visitors (falls back to emerald if missing/unknown)
 *   SITE_THEME_LOCK=true  force that theme: hides the theme picker and ignores a visitor's saved choice
 */
export function envTheme(): { theme: ThemeId; locked: boolean } {
  const id = (process.env.SITE_THEME ?? "").trim().toLowerCase();
  const theme = THEMES.find((t) => t.id === id)?.id ?? DEFAULT_THEME;
  const locked = /^(1|true|yes|on)$/i.test((process.env.SITE_THEME_LOCK ?? "").trim());
  return { theme, locked };
}

/** SITE_REGISTER=false closes sign-up (buttons/links hidden, /register shows a closed notice, API refuses). Default: open. */
export function registerEnabled(): boolean {
  return !/^(0|false|no|off)$/i.test((process.env.SITE_REGISTER ?? "").trim());
}
