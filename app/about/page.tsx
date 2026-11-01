import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Letter from "@/components/about/Letter";
import { CoffeeRing, Splatter, Tape } from "@/components/contact/ContactDecor";

export const metadata: Metadata = {
  title: "About me",
  description: "A note from me to you.",
};

// ---- About page --------------------------------------------------------------
// Plain HTML + CSS on purpose (no 3D canvas), so scrolling stays smooth. It
// reuses the same PageShell as the other inner pages, so the sticky header shows
// "About me" as the current page (and, on small screens, the next note says
// "Projects" with an arrow) and the footer carries the live year.
export default function AboutPage() {
  return (
    <PageShell>
      {/* Full-width wrapper: the edge doodles are positioned against the
          viewport, outside the centred column of text. `overflow-x-clip` is a
          safety net so nothing here can ever add a sideways scrollbar. */}
      <div className="relative overflow-x-clip">
        <AboutDecor />

        <section className="relative z-10 mx-auto w-full max-w-5xl px-2 pb-24 pt-12 md:px-8 md:pt-16">
          {/* page title + the short line under it */}
          <header className="text-center">
            <h1 className="text-4xl text-[#15130f] md:text-5xl">About me</h1>
            <p className="mt-2 text-base text-[#4a453c] md:text-lg">A note from me to you</p>
          </header>

          {/* the letter itself */}
          <div className="mt-12 md:mt-16">
            <Letter />
          </div>
        </section>
      </div>
    </PageShell>
  );
}

/** A few low-contrast doodles at the page edges, reusing the Tools page set.
 *  They are aria-hidden and pointer-events-none, and they sit in the padding
 *  around the letter — never on top of it. Phones get at most two small ones. */
function AboutDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 select-none">
      {/* phones: two small marks in the top corners, beside the centred title */}
      <span className="absolute left-2 top-5 h-8 w-8 opacity-40 md:hidden">
        <Splatter />
      </span>
      <span className="absolute right-2 top-11 h-9 w-9 opacity-30 md:hidden">
        <CoffeeRing />
      </span>

      {/* md: tucked into the padding below the letter */}
      <span className="absolute bottom-6 left-4 hidden h-16 w-16 opacity-30 md:block lg:hidden">
        <CoffeeRing />
      </span>
      <span className="absolute bottom-4 right-4 hidden h-7 w-20 -rotate-6 opacity-40 md:block lg:hidden">
        <Tape />
      </span>

      {/* lg: the wide side margins get the full set */}
      <span className="absolute left-6 top-40 hidden h-20 w-20 opacity-25 lg:block">
        <CoffeeRing />
      </span>
      <span className="absolute right-10 top-56 hidden h-14 w-14 opacity-25 lg:block">
        <Splatter />
      </span>
      <span className="absolute left-10 top-1/2 hidden h-7 w-20 rotate-[6deg] opacity-35 lg:block">
        <Tape />
      </span>
      <span className="absolute right-6 bottom-40 hidden h-16 w-16 opacity-25 lg:block">
        <CoffeeRing />
      </span>
      <span className="absolute left-8 bottom-24 hidden h-7 w-24 -rotate-12 opacity-40 lg:block">
        <Tape />
      </span>
    </div>
  );
}
