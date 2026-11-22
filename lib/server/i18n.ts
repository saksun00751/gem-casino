import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LANG_COOKIE, format, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** Server-side translator for route handlers: const t = await getT(); t("ข้อความไทย") */
export async function getT() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (text: string, vars?: Record<string, string | number>) => format(dict[text] ?? text, vars);
}
