import { pageTitle } from "@/lib/server/meta";

// Page title: "ติดต่อเรา | <site name>" (translated; the "| site name" template is in the root layout).
export const generateMetadata = pageTitle("ติดต่อเรา");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
