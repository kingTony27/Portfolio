import type { ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

// ---- Shared shell for the inner pages ---------------------------------------
// Wraps a page with the sticky header, the paper background and the footer.
// Used by /projects, /about and /contact so they all look the same and the
// header links never lead to a 404.
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      {/* Full-page paper background. It is a *fixed* layer instead of a CSS
          background on the page so the browser paints it once and just
          composites it while scrolling — that keeps scrolling smooth. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[#f5f2ea]"
        style={{
          backgroundImage: "url('/images/paper_bg.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
