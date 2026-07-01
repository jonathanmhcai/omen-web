import Footer from "./Footer";
import SiteHeader from "./SiteHeader";

/**
 * Page chrome for the bare public pages (landing, /traders, /traders/[name]):
 * marketing header on top, footer pinned to the bottom. The page provides its
 * own `<main className="flex-1">` so content fills the space between.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {children}
      <Footer />
    </div>
  );
}
