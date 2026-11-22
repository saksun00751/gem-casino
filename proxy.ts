import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LANG_COOKIE, LOCALES, isLocale } from "@/lib/i18n/config";

// The visitor's language lives in a cookie. URLs stay clean (/promotions/); internally every page request is
// rewritten to /<locale>/promotions/ so each language is its own statically generated page.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1];
  if ((LOCALES as readonly string[]).includes(first)) return NextResponse.next(); // someone opened /en/... directly
  const fromCookie = req.cookies.get(LANG_COOKIE)?.value;
  const locale = isLocale(fromCookie) ? fromCookie : DEFAULT_LOCALE;
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.rewrite(url);
  res.headers.append("Vary", "Cookie");
  return res;
}

export const config = {
  // pages only: skip API, Next internals and any file with an extension
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
