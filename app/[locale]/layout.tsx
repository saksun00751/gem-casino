import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Prompt, Noto_Sans_Khmer, Noto_Sans_Lao, Noto_Sans_Myanmar } from "next/font/google";
import "../globals.css";
import { SiteProvider } from "@/components/providers";
import { Toaster } from "@/components/toaster";
import { getSiteMeta } from "@/lib/server/site";
import { envTheme, registerEnabled } from "@/lib/theme";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { I18nProvider } from "@/components/i18n-provider";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"], // 300 is not used anywhere (saves font files)
  variable: "--font-prompt",
  display: "swap",
});

// Thai + Latin come from Prompt; Khmer / Lao / Burmese need their own font (only the visitor's one is applied/preloaded).
const khmer = Noto_Sans_Khmer({ subsets: ["khmer"], weight: ["400", "500", "600"], variable: "--font-script", display: "swap" });
const lao = Noto_Sans_Lao({ subsets: ["lao"], weight: ["400", "500", "600"], variable: "--font-script", display: "swap" });
const myanmar = Noto_Sans_Myanmar({ subsets: ["myanmar"], weight: ["400", "500", "600"], variable: "--font-script", display: "swap" });
const SCRIPT_FONT: Partial<Record<Locale, string>> = { kh: khmer.variable, la: lao.variable, my: myanmar.variable };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const FALLBACK: Metadata = {
  title: { default: "Gem Casino — รวมผู้ให้บริการเกม", template: "%s | Gem Casino" },
  description: "รวมผู้ให้บริการเกมครบวงจร ดูได้ทุกอุปกรณ์",
};

// Tab title, description, favicon and share cards come from the backend's site info.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = isLocale(locale) ? await getDictionary(locale) : {};
  const site = await getSiteMeta();
  if (!site) return { ...FALLBACK, description: dict["รวมผู้ให้บริการเกมครบวงจร ดูได้ทุกอุปกรณ์"] ?? FALLBACK.description };
  const images = site.logo ? [site.logo] : undefined;
  return {
    title: { default: site.name, template: `%s | ${site.name}` },
    description: site.description || FALLBACK.description,
    ...(site.logo ? { icons: { icon: [{ url: site.logo }], shortcut: [{ url: site.logo }], apple: [{ url: site.logo }] } } : {}),
    openGraph: { title: site.title, description: site.description, siteName: site.name, images },
    twitter: { card: "summary_large_image", title: site.title, description: site.description, images },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const site = await getSiteMeta();
  const { theme, locked } = envTheme();
  return (
    <html lang={locale === "kh" ? "km" : locale === "la" ? "lo" : locale} data-theme={theme} className={`${prompt.variable} ${SCRIPT_FONT[locale] ?? ""}`} suppressHydrationWarning>
      <head>
        {/* On a reload the browser keeps re-applying the old scroll offset while the (client-loaded) game list grows the page,
            which ends up at the footer. For a reload, pin the page to the top until the visitor scrolls themselves
            (or 4 s pass); back/forward navigation keeps normal scroll restoration. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='reload'){history.scrollRestoration='manual';scrollTo(0,0);var go=true;var up=function(){if(go&&scrollY>0)scrollTo(0,0)};addEventListener('scroll',up,{passive:true});var stop=function(){go=false};['wheel','touchstart','keydown','pointerdown'].forEach(function(t){addEventListener(t,stop,{passive:true,once:true})});setTimeout(function(){go=false;removeEventListener('scroll',up);history.scrollRestoration='auto'},4000)}}catch(e){}",
          }}
        />
      </head>
      <body className="antialiased">
        <I18nProvider locale={locale} dict={dict}>
          <SiteProvider site={site} defaultTheme={theme} themeLocked={locked} registerEnabled={registerEnabled()}>{children}<Toaster /></SiteProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
