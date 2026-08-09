import Footer from "./Footer";
import SiteHeader from "./SiteHeader";

/**
 * Page chrome for the bare public pages (landing, /traders, /traders/[name]):
 * marketing header on top, footer pinned to the bottom. The page provides its
 * own `<main className="flex-1">` so content fills the space between.
 * `showHeader={false}` drops the wordmark header (the landing page hero
 * already carries the brand).
 */
export default function SiteChrome({
  children,
  showHeader = true,
}: {
  children: React.ReactNode;
  showHeader?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {showHeader && <SiteHeader />}
      {children}
      <Footer />
    </div>
  );
}
