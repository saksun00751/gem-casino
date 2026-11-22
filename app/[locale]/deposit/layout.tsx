import { pageTitle } from "@/lib/server/meta";

// Page title: "เติมเงิน | <site name>" (translated; the "| site name" template is in the root layout).
export const generateMetadata = pageTitle("เติมเงิน");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
