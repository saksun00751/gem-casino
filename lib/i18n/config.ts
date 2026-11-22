// Languages: same set as lotto-seed-app. Thai is the source language (the Thai text itself is the key).
export const LOCALES = ["th", "en", "kh", "la", "my"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";
export const LANG_COOKIE = "site_lang";

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

export const LOCALE_INFO: Record<Locale, { label: string; flag: string; tag: string; backend: string }> = {
  th: { label: "ไทย", flag: "🇹🇭", tag: "th-TH", backend: "th" },
  en: { label: "English", flag: "🇬🇧", tag: "en-US", backend: "en" },
  kh: { label: "ខ្មែរ", flag: "🇰🇭", tag: "km-KH", backend: "kh" },
  la: { label: "ລາວ", flag: "🇱🇦", tag: "lo-LA", backend: "la" },
  my: { label: "မြန်မာ", flag: "🇲🇲", tag: "my-MM", backend: "my" },
};

/** {name} placeholders: t("ทั้งหมด {n} รายการ", { n: 5 }) */
export function format(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
