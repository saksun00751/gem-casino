"use client";
import * as React from "react";
import { DEFAULT_LOCALE, LANG_COOKIE, LOCALE_INFO, format, type Locale } from "@/lib/i18n/config";
import type { Dict } from "@/lib/i18n/dictionaries";

type Ctx = {
  locale: Locale;
  /** Thai source text (+ {vars}) -> text in the current language. */
  t: (text: string, vars?: Record<string, string | number>) => string;
  setLocale: (l: Locale) => void;
  /** BCP-47 tag for Intl / toLocaleString (th-TH, en-US ...). */
  tag: string;
};

const I18nContext = React.createContext<Ctx>({ locale: DEFAULT_LOCALE, t: (x, v) => format(x, v), setLocale: () => {}, tag: "th-TH" });

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  const t = React.useCallback((text: string, vars?: Record<string, string | number>) => format(dict[text] ?? text, vars), [dict]);
  const setLocale = React.useCallback((l: Locale) => {
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    try { localStorage.setItem("lang", l); } catch { /* storage blocked */ }
    window.location.reload(); // the page (and its cached payloads) are per language: reload is the simplest correct switch
  }, []);
  const value = React.useMemo(() => ({ locale, t, setLocale, tag: LOCALE_INFO[locale].tag }), [locale, t, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => React.useContext(I18nContext);
/** const t = useT(); t("ข้อความไทย") */
export const useT = () => React.useContext(I18nContext).t;
