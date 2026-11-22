import { pageTitle } from "@/lib/server/meta";

// Page title: "โปรโมชัน | <site name>" (translated; the "| site name" template is in the root layout).
export const generateMetadata = pageTitle("โปรโมชัน");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
