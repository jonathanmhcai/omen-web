import Footer from "./Footer";
import TopNav from "./TopNav";

/**
 * Page chrome for the footer-bearing public pages (the daily brief at `/`,
 * /traders, /traders/[name]): the shared TopNav bar on top, footer
 * pinned to the bottom. The page provides its own
 * `<main className="flex-1">` so content fills the space between.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <TopNav />
      {children}
      <Footer />
    </div>
  );
}
