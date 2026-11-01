import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { CoffeeRing, Splatter, Tape } from "@/components/contact/ContactDecor";
import DepartmentSection from "@/components/tools/DepartmentSection";
import { departments } from "@/data/tools";

export const metadata: Metadata = { title: "Tools" };

// ---- Tools page --------------------------------------------------------------
// Plain HTML + CSS on purpose (no 3D canvas), so scrolling stays smooth.
// Four newspaper-style departments, each with a row of tools underneath.
export default function ToolsPage() {
  return (
    <PageShell>
      {/* `relative` wrapper = the whole viewport width, so the edge doodles can
          sit outside the centred column of text. `overflow-x-clip` is a safety
          net: nothing in here can add a sideways scrollbar to the page. */}
      <div className="relative overflow-x-clip">
        <ToolsDecor />

        <section className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-10 pt-12 md:px-8 md:pt-16">
          {/* page title + the short line under it */}
          <header className="text-center">
            <h1 className="text-4xl text-[#15130f] md:text-5xl">Tools</h1>
            <p className="mt-2 text-base text-[#4a453c] md:text-lg">What&apos;s on my desk</p>
          </header>

          {/* the four departments, stacked vertically */}
          <div className="mt-12 flex flex-col gap-14 md:mt-16 md:gap-20">
            {departments.map((department, index) => (
              <DepartmentSection
                key={department.id}
                department={department}
                index={index}
              />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

/** A few low-contrast doodles at the page edges. They are aria-hidden and
 *  pointer-events-none, and they never sit on top of the text or the tool rows.
 *  Phones get two tiny ones; md gets three; lg (wide margins) gets the full set. */
function ToolsDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 select-none">
      {/* phones: two small marks in the top corners, beside the centred title */}
      <span className="absolute left-2 top-6 h-8 w-8 opacity-40 md:hidden">
        <Splatter />
      </span>
      <span className="absolute right-2 top-12 h-9 w-9 opacity-30 md:hidden">
        <CoffeeRing />
      </span>

      {/* md: tucked into the bottom padding, below the last row */}
      <span className="absolute bottom-1 left-4 hidden h-8 w-8 opacity-30 md:block lg:hidden">
        <Splatter />
      </span>
      <span className="absolute bottom-2 right-4 hidden h-7 w-20 -rotate-6 opacity-40 md:block lg:hidden">
        <Tape />
      </span>

      {/* lg: the side margins are wide enough for the full set */}
      <span className="absolute left-6 top-24 hidden h-20 w-20 opacity-25 lg:block">
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
      <span className="absolute left-8 bottom-16 hidden h-7 w-24 -rotate-12 opacity-40 lg:block">
        <Tape />
      </span>
    </div>
  );
}
