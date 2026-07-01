export default function Footer() {
  return (
    <footer className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
      <div className="max-w-full md:max-w-5xl xl:max-w-6xl mx-auto pt-24 md:pt-16 lg:pt-0 pb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          {/* Left side */}
          <div className="flex flex-col gap-2">
            <a
              href="https://x.com/omentrading"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground text-sm hover:opacity-70 transition-opacity flex items-center gap-1.5"
            >
              Follow us on{" "}
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-current"
                aria-label="X logo"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <p className="text-muted-foreground text-xs">
              © 2026 Omen Trading, Inc. All rights reserved
            </p>
          </div>

          {/* Right side - Links row on desktop */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <a
              href="mailto:support@omen.trading"
              className="text-foreground text-sm hover:opacity-70 transition-opacity"
            >
              Contact
            </a>
            <a
              href="https://omen.trading/support"
              className="text-foreground text-sm hover:opacity-70 transition-opacity"
            >
              Support
            </a>
            <a
              href="https://omen.trading/terms"
              className="text-foreground text-sm hover:opacity-70 transition-opacity"
            >
              Terms of Service
            </a>
            <a
              href="https://omen.trading/privacy"
              className="text-foreground text-sm hover:opacity-70 transition-opacity"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
