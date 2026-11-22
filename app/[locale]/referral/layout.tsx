import { pageTitle } from "@/lib/server/meta";

// Page title: "แนะนำเพื่อน | <site name>" (translated; the "| site name" template is in the root layout).
export const generateMetadata = pageTitle("แนะนำเพื่อน");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
