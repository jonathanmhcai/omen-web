import Link from "next/link";

/**
 * Bare landing page. The signals feed now lives at `/stories`; `/` is
 * an intentionally minimal entry point with a single link through to it.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold leading-none">Omen</h1>
      <Link
        href="/stories"
        className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Go to stories
      </Link>
    </main>
  );
}
