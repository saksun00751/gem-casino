import type { Locale } from "@/lib/i18n/config";

export type Dict = Record<string, string>;

// Thai is the source text itself, so it needs no dictionary. Other languages map Thai text -> translation.
// A missing entry simply falls back to the Thai text.
const loaders: Record<Locale, () => Promise<Dict>> = {
  th: async () => ({}),
  en: () => import("./locales/en.json").then((m) => m.default as Dict),
  kh: () => import("./locales/kh.json").then((m) => m.default as Dict),
  la: () => import("./locales/la.json").then((m) => m.default as Dict),
  my: () => import("./locales/my.json").then((m) => m.default as Dict),
};

// Untranslated text in km / lo / my falls back to English first (more useful than Thai), then to the Thai source.
export async function getDictionary(locale: Locale): Promise<Dict> {
  if (locale === "th" || locale === "en") return loaders[locale]();
  const [en, own] = await Promise.all([loaders.en(), loaders[locale]()]);
  return { ...en, ...own };
}
