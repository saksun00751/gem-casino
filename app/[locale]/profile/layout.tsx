import { pageTitle } from "@/lib/server/meta";

// Page title: "โปรไฟล์ | <site name>" (translated; the "| site name" template is in the root layout).
export const generateMetadata = pageTitle("โปรไฟล์");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
