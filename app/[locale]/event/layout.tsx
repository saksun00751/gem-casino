import { pageTitle } from "@/lib/server/meta";

// Page title: "กิจกรรม แลกรางวัล | <site name>" (translated; the "| site name" template is in the root layout).
export const generateMetadata = pageTitle("กิจกรรม แลกรางวัล");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
