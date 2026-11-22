import { pageTitle } from "@/lib/server/meta";

// Page title: "ประวัติการเงิน | <site name>" (translated; the "| site name" template is in the root layout).
export const generateMetadata = pageTitle("ประวัติการเงิน");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
