import type { Metadata } from "next";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/** generateMetadata for a page segment: title = translated Thai text ("<title> | <site name>" template in the root layout). */
export const pageTitle = (thai: string) =>
  async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    const dict = isLocale(locale) ? await getDictionary(locale) : {};
    return { title: dict[thai] ?? thai };
  };
