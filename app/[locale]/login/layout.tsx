import { pageTitle } from "@/lib/server/meta";

// Page title: "เข้าสู่ระบบ | <site name>" (translated; the "| site name" template is in the root layout).
export const generateMetadata = pageTitle("เข้าสู่ระบบ");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
